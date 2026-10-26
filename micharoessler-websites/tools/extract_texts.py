# Extract every visible DE/EN copy pair (strings, arrays, objects, JSX branches) in source order.
import re, sys, json
def scan_branch(t, i):
    """t[i] is an opening bracket; return index after the matching close (respects quotes/backticks)."""
    pairs = {'(': ')', '[': ']', '{': '}'}
    stack = [pairs[t[i]]]; j = i + 1; q = None
    while j < len(t) and stack:
        c = t[j]
        if q:
            if c == '\\': j += 2; continue
            if c == q: q = None
        elif c in "'`\"" and not (t[j-1].isalnum()): q = c
        elif c in pairs: stack.append(pairs[c])
        elif c == stack[-1]: stack.pop()
        j += 1
    return j
STR = re.compile(r"'((?:[^'\\]|\\.)*)'")
JSXT = re.compile(r">\s*([^<>{}]*[A-Za-zÄÖÜäöü][^<>{}]*?)\s*<")
def strings(chunk):
    out = []
    for m in re.finditer(r"'((?:[^'\\]|\\.)*)'|>\s*([^<>{}]*[A-Za-zÄÖÜäöü][^<>{}]*?)\s*<", chunk):
        v = (m.group(1) if m.group(1) is not None else m.group(2)).replace("\\'", "'").strip()
        if not v or re.fullmatch(r'[\w\-./#:%]+', v) and not re.search(r'\s', v) and len(v) < 3: continue
        if re.fullmatch(r'(meta|mono|label|btn[\w -]*|prose[\w-]*|reveal|wrap[\w -]*|[a-z-]+\.(jpg|png|astro)|\.\./[\w./-]+|https?://\S+|/[\w/-]*)', v): continue
        out.append(v)
    return out
res = []
for f in sys.argv[1:]:
    t = open(f).read(); pos = 0
    rx = re.compile(r"(?:\blang\s*===\s*')?\b(en|de)'?\s*\?\s*")
    while True:
        m = rx.search(t, pos)
        if not m: break
        k = m.end()
        if t[k] == "'":
            a = STR.match(t, k); b = None
            if a:
                rest = t[a.end():]; mm = re.match(r"\s*:\s*", rest)
                if mm:
                    b = STR.match(t, a.end() + mm.end())
            if a and b:
                x, y = a.group(1).replace("\\'", "'"), b.group(1).replace("\\'", "'")
                res.append((f, t.count('\n', 0, m.start()) + 1, *( (x, y) if m.group(1) == 'de' else (y, x) )))
                pos = b.end(); continue
        elif t[k] in '([{':
            e1 = scan_branch(t, k); mm = re.match(r"\s*:\s*", t[e1:])
            if mm and t[e1 + mm.end()] in '([{':
                k2 = e1 + mm.end(); e2 = scan_branch(t, k2)
                s1, s2 = strings(t[k:e1]), strings(t[k2:e2])
                de, en = (s1, s2) if m.group(1) == 'de' else (s2, s1)
                line = t.count('\n', 0, m.start()) + 1
                for x, y in zip(de, en):
                    if x != y or not re.fullmatch(r'[\d\W]+', x): res.append((f, line, x, y))
                if len(de) != len(en): res.append((f, line, f'!! {len(de)} vs {len(en)} strings', ''))
                pos = e2; continue
        pos = k
    for m in re.finditer(r"\{\s*(en|de):\s*'((?:[^'\\]|\\.)*)',\s*(en|de):\s*'((?:[^'\\]|\\.)*)',?\s*\}", t, re.S):
        d = {m.group(1): m.group(2).replace("\\'", "'"), m.group(3): m.group(4).replace("\\'", "'")}
        res.append((f, t.count('\n', 0, m.start()) + 1, d['de'], d['en']))
    um = re.search(r"export const ui = \{\s*en: \{(.*?)\n\t\},\s*de: \{(.*?)\n\t\},", t, re.S)
    if um:
        kv = lambda blk: re.findall(r"(\w+): '((?:[^'\\]|\\.)*)'", blk)
        en_kv, de_kv = dict(kv(um.group(1))), dict(kv(um.group(2)))
        line = t.count('\n', 0, um.start()) + 1
        for k, v in en_kv.items():
            if k in de_kv: res.append((f, line, de_kv[k], v))
res = [r for r in res if not re.match(r'^(/|https?://)', r[2]) and not r[2].startswith('!!') and not re.fullmatch(r'[a-z]{2}([-_][A-Z]{2})?', r[2])]
res.sort(key=lambda r: (sys.argv.index(r[0]), r[1]))
seen = set(); final = []
for r in res:
    key = (r[2], r[3])
    if key in seen: continue
    seen.add(key); final.append(r)
json.dump(final, open(sys.stdout.fileno(), 'w', closefd=False), ensure_ascii=False, indent=0)
