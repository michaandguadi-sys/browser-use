"""A fictional person with 90 days of history, to show what the mentor becomes with time and data.

Noa (31) is a freelance documentary photographer and trail runner, living in a van in Patagonia with her partner
Tomás. The simulation has a hidden "truth" (when she is receptive, which coaching moves work for her) and runs the
mentor's real learning code over it day by day, so the demo shows the actual algorithm converging, not a mock-up.
All text is invented. Deterministic: the same seed gives the same 90 days.
"""

import random
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from app import learning
from app.db import DB
from app.views import NeedState, Pattern, PersonModelBody, TraitEstimate, ValueEstimate

TZ = 'America/Santiago'
DAYS = 90
SEED = 7

# Hidden truth the mentor has to discover.
TRUE_RECEPTIVITY = {6: 0.75, 8: 0.75, 10: 0.45, 12: 0.15, 14: 0.3, 16: 0.5, 18: 0.6, 20: 0.55, 22: 0.3}
MOVE_EFFECT = {
	'implementation_intention': 1.25,
	'progress_check': 1.15,
	'red_team': 1.05,
	'socratic_question': 1.0,
	'mental_contrasting': 1.0,
	'reflection_prompt': 1.0,
	'wellbeing_check': 0.95,
	'values_reconnect': 0.85,
	'human_routing': 0.8,
	'celebrate_progress': 0.5,
}

MEMORY = [
	(
		'north_star',
		'Publish "Wind People", a photo book about the last horse-riding gauchos of Aysén, and become a photographer who is commissioned for long-form documentary work.',
	),
	('value', 'Freedom over security: rather live in the van and own my time than take a staff job.'),
	('value', 'Respect for the people I photograph: no extraction, they see the pictures first.'),
	('value', 'Craft: one strong frame beats a hundred okay ones.'),
	('anti_goal', 'Never again shoot weddings just for money for a whole season.'),
	('goal', 'Book dummy (60 spreads) finished and sent to 3 publishers by end of January.'),
	('goal', 'Apply for the National Geographic Explorer grant (early career) before the deadline.'),
	('strength', 'Patient with people; gauchos let me stay for weeks.'),
	('strength', 'Endurance: can hike and shoot for 12 hours.'),
	('blind_spot', 'Admin and emails slip completely on travel days and after long shoots.'),
	('blind_spot', 'Edits forever instead of showing work to anyone.'),
	('coaching_pref', 'Short, direct, no cheerleading. Ask for numbers. Back off when I am on the road.'),
	('person', 'Tomás: partner, mechanic and climber, keeps the van alive; we decide money questions together.'),
	('person', 'Lucía Vera: photo editor in Santiago who once said my work needs a sharper edit.'),
	('person', 'Don Arturo: 78-year-old gaucho near Cochrane, main character of the book.'),
	('project', 'Wind People photo book: 4,200 selects, sequencing in progress.'),
	('project', 'Trail running: training for the Patagonian Run 50K in March.'),
	('context', 'Lives in a van with Tomás, moving between Aysén and Magallanes; spotty signal, Starlink some days.'),
	('context', 'Income from stock photography and two tourism clients; savings for about 5 months.'),
	('lesson', 'When I show 10 frames to someone, I finish more than in a week of editing alone.'),
]

COMMITMENTS = [
	('Send 20 strongest frames to Lucía for feedback', 12, True),
	('Draft the NatGeo grant project statement (500 words)', 30, True),
	('Book printer quote for the dummy', 46, True),
	('Ask Don Arturo for permission to use the portraits in the book', 55, True),
	('Email 3 publishers with the dummy PDF', 84, False),
	('Grant budget sheet', 93, False),
]

UPDATES = [
	('{h}h sequencing the book this morning. The horse section finally breathes.', 'book'),
	('Edited {h}h, mostly the river crossing series. Still too many similar frames.', 'book'),
	('Long drive to Puerto Río Tranquilo today, nothing done. Tired.', 'travel'),
	('Ran 18 km along the lake, legs good. Then {h}h on captions for Don Arturo chapter.', 'book'),
	('Money stress today, a client paid late. Did stock uploads instead of the book.', 'money'),
	('Tomás and I argued about staying another month in Aysén. Resolved, but drained.', 'people'),
	('Pitched the gaucho story to a magazine editor. First pitch in weeks.', 'pitch'),
	('Shot at the estancia at sunrise, wind was insane, two frames I love.', 'shoot'),
	('Rain all day in the van. {h}h on the dummy layout.', 'book'),
	('Signal was dead for two days, back now.', 'travel'),
	('Sent the grant draft to a friend who won it last year.', 'pitch'),
	('Slept badly, did nothing useful. Walked the dog of the campsite owner.', 'low'),
]

CHECKINS = {
	'implementation_intention': [
		'You said the publisher emails are next. When exactly, and where will you be? Give me the if-then.',
		'Captions keep sliding. If you park the van tomorrow morning, then what do you do first, before the camera?',
		'The grant budget is the last missing piece. Which day, which hour, and what makes it start?',
	],
	'progress_check': [
		'Book hours this week: {hours} of 6. What moved it, and what stopped it?',
		'Quick number: how many spreads in the dummy are locked now?',
		'Pitches this week: {pitches}. What would it take to send one more before Sunday?',
	],
	'red_team': [
		"Devil's advocate: maybe the book is too long and nobody needs 60 spreads. What survives if you cut to 40?",
		'Strongest case against the grant: your project looks like a book, not a story with field research. How do you answer that?',
	],
	'socratic_question': [
		'You keep editing the river series. What would have to be true for it to be finished?',
		'Who is the book for, honestly: the gauchos, publishers, or you?',
	],
	'mental_contrasting': [
		"Picture the dummy on Lucía's table in January. What is the one inner thing most likely to stop that?",
	],
	'reflection_prompt': [
		'What did today teach you about how you work best?',
		'One frame from today you would defend in front of Lucía, and why?',
	],
	'wellbeing_check': [
		'Three travel days in a row. How are your energy and sleep, honestly, 1 to 5?',
		'You sounded drained yesterday after the talk with Tomás. How is it today?',
	],
	'values_reconnect': [
		'You chose the van over a staff job for freedom. Does this week feel free or just busy?',
	],
	'human_routing': [
		'Who besides Lucía could see 10 frames this week? Name one person.',
		'Is there a photographer who did a book with a small publisher you could ask for 20 minutes?',
	],
	'celebrate_progress': [
		'Six book hours this week, that is your target. What made it possible?',
	],
}

REPLIES = {
	'implementation_intention': [
		'Thursday 8am at the café in Cochrane, before the shoot. If I open the laptop, emails first.',
		'Tomorrow after the run, 9:30, in the van. Laptop on the table the night before.',
	],
	'progress_check': [
		'{hours}. The rain helped, the drive killed Tuesday.',
		'38 of 60 locked. The rest is the hard part.',
		'Zero pitches. I avoid it, you know that.',
	],
	'red_team': [
		'Fair. 40 would be stronger. I will cut the repetitive landscape spreads.',
		'I would say: I have lived with them for 2 years. That is the field research.',
	],
	'socratic_question': [
		'When I stop finding frames that change the story. Probably already true.',
		'For Don Arturo first. Then for me.',
	],
	'mental_contrasting': ['Me waiting until it feels perfect. I know.'],
	'reflection_prompt': [
		'That I work better when I tell someone what I will do.',
		'The hands on the reins. It is the whole book in one frame.',
	],
	'wellbeing_check': ['2. Need a slow day.', 'Better. We talked again in the morning.'],
	'values_reconnect': ['Busy. Too much stock work this week.'],
	'human_routing': ['Maybe Camila, she did a book with a small press in Valparaíso.', 'I will ask Lucía who else could look.'],
	'celebrate_progress': ['ok'],
}

FOLLOWUPS = [
	'Good. Write it in your calendar now and tell me Thursday how it went.',
	'Then that is the plan. Small, specific, done before the camera comes out.',
	'Noted. I will ask about it on Sunday with the numbers.',
	"Cut them. A sharper edit was Lucía's point too.",
]

EVENING = [
	'What happened today that matters for the book?',
	'What would you do differently tomorrow?',
	'One thing you noticed about yourself today?',
]
EVENING_REPLIES = [
	'Edited, ran, ate with Tomás. Good day.',
	'Nothing for the book. Fine, it was a driving day.',
	'That I avoid emails when I am tired.',
]
WEEKLY_REPLIES = [
	'Wednesday is parked. If I wake up there, then two hours on the dummy before coffee.',
	'Fair numbers. Next week the van stays in Cochrane, so the book gets the mornings.',
	'Bad week, I know. Money first, then the book on Friday.',
]
WEEKLY = 'Week in numbers: book {hours} of 6 h, pitches {pitches} of 1, commitments {done} kept. Pattern: the book moves on parked days and stops on travel days. Next week: which day is parked, and what is the if-then for that morning?'


def _models() -> list[tuple[int, str, PersonModelBody]]:
	"""Three rebuilds: the picture sharpens with more data and better models."""
	v1 = PersonModelBody(
		summary='Early days. Noa is a nomadic documentary photographer working on her first photo book. Little evidence yet; ask more than assume.',
		traits=[
			TraitEstimate(
				trait='openness',
				score=78,
				confidence=0.3,
				evidence='lives in a van, long-form documentary work',
				coaching_implication='explore ideas, she likes "what if"',
			),
		],
		values=[ValueEstimate(value='self_direction', rank=1, confidence=0.4, evidence='"freedom over security"')],
		needs=[NeedState(need='autonomy', state='met', evidence='chooses her own projects')],
		patterns=[],
		coaching_style='Short and direct, she asked for no cheerleading.',
		avoid=['generic motivation'],
		open_questions=['What derails her?', 'When does she work best?', 'Who gives her honest feedback?'],
	)
	v2 = PersonModelBody(
		summary='Noa moves the book on parked days and loses whole days to travel and money worries. She answers concrete questions and ignores praise.',
		traits=[
			TraitEstimate(
				trait='openness',
				score=82,
				confidence=0.55,
				evidence='curious, many story ideas, unusual life',
				coaching_implication='give her one sharp idea to test',
			),
			TraitEstimate(
				trait='conscientiousness',
				score=38,
				confidence=0.45,
				evidence='admin and emails slip; long edits without deadlines',
				coaching_implication='make plans tiny and dated',
			),
			TraitEstimate(
				trait='extraversion',
				score=32,
				confidence=0.4,
				evidence='avoids pitching, recharges alone in nature',
				coaching_implication='route to one person at a time, not networking events',
			),
			TraitEstimate(
				trait='neuroticism',
				score=64,
				confidence=0.35,
				evidence='money stress days, drained after conflict',
				coaching_implication='check energy before pushing',
			),
		],
		values=[
			ValueEstimate(value='self_direction', rank=1, confidence=0.65, evidence='van life, refuses staff job'),
			ValueEstimate(value='universalism', rank=2, confidence=0.5, evidence='respect for the gauchos, no extraction'),
			ValueEstimate(value='stimulation', rank=3, confidence=0.45, evidence='running, wind, remote places'),
		],
		needs=[
			NeedState(need='autonomy', state='met', evidence='owns her time'),
			NeedState(need='competence', state='mixed', evidence='loves her frames, doubts the edit'),
			NeedState(need='relatedness', state='mixed', evidence='close to Tomás, isolated from photo peers'),
		],
		patterns=[
			Pattern(
				pattern='Book hours happen on parked or rainy days, almost never on travel days',
				confidence=0.6,
				evidence='hours logged vs days with drives',
				implication='plan book work only for parked days',
			),
			Pattern(
				pattern='Midday messages go unanswered',
				confidence=0.5,
				evidence='low reply rate 12-14h',
				implication='write in the morning or early evening',
			),
		],
		coaching_style='Direct, numbers first, one question. Mornings before 10 or after 18.',
		avoid=['praise for its own sake ("cheesy")', 'midday check-ins'],
		open_questions=[
			'Why does she avoid showing work?',
			'What is the real money runway?',
			'How do she and Tomás decide on routes?',
		],
	)
	v3 = PersonModelBody(
		summary='Noa is close to a finished dummy but avoids the exposed part: showing it. Implementation intentions and number checks work; praise does not. Money worry, not anxiety, drives her bad days (her correction).',
		traits=[
			TraitEstimate(
				trait='openness',
				score=84,
				confidence=0.75,
				evidence='constant new story angles, comfortable with uncertainty',
				coaching_implication='use red-team and "what if" questions when energy is high',
			),
			TraitEstimate(
				trait='conscientiousness',
				score=36,
				confidence=0.7,
				evidence='commitments with a date and place get done (4 of 5), open-ended ones slip',
				coaching_implication='every plan gets a day, place and first action',
			),
			TraitEstimate(
				trait='extraversion',
				score=30,
				confidence=0.65,
				evidence='pitches only after rehearsing in chat; avoids calls',
				coaching_implication='prepare pitches in writing, one person at a time',
			),
			TraitEstimate(
				trait='agreeableness',
				score=62,
				confidence=0.5,
				evidence='puts the gauchos and Tomás first, sometimes over her own deadlines',
				coaching_implication='frame her goals as good for the people she photographs too',
			),
			TraitEstimate(
				trait='neuroticism',
				score=48,
				confidence=0.6,
				evidence='stress is situational (late payments), she corrected "anxious"',
				coaching_implication='address money concretely, do not psychologise',
			),
		],
		values=[
			ValueEstimate(value='self_direction', rank=1, confidence=0.8, evidence='van, freedom over security, own projects'),
			ValueEstimate(value='universalism', rank=2, confidence=0.7, evidence='gauchos see the pictures first'),
			ValueEstimate(
				value='achievement', rank=3, confidence=0.55, evidence='wants publishers and the grant, more than she admits'
			),
			ValueEstimate(value='stimulation', rank=4, confidence=0.55, evidence='running, wind, remote places'),
		],
		needs=[
			NeedState(need='autonomy', state='met', evidence='owns her time and routes'),
			NeedState(need='competence', state='mixed', evidence='strong frames, unsure about the edit until Lucía responded'),
			NeedState(
				need='relatedness',
				state='strained',
				evidence='no photo peers since leaving Santiago; Camila contact not yet made',
			),
		],
		patterns=[
			Pattern(
				pattern='Book hours happen on parked or rainy days, almost never on travel days',
				confidence=0.85,
				evidence='42 of 47 book hours on parked days',
				implication='ask on Sunday which days are parked and attach the if-then',
			),
			Pattern(
				pattern='Showing work unlocks progress; editing alone stalls it',
				confidence=0.75,
				evidence='Lucía feedback week: 9 h; weeks without anyone: 2 h average',
				implication='end weeks with "who sees 10 frames next?"',
			),
			Pattern(
				pattern='Late client payments wreck the day',
				confidence=0.65,
				evidence='3 money days, 0 book hours each',
				implication='on money days, one stock task, then stop; no book guilt',
			),
			Pattern(
				pattern='Replies in the morning (06-10h) and early evening; ignores midday',
				confidence=0.8,
				evidence='reply rate 75% mornings vs 15% midday',
				implication='timing learner already avoids midday',
			),
		],
		coaching_style='Two sentences, a number, one if-then question. English, dry humour ok. Push on publishers and grants; back off on travel days.',
		avoid=['praise or celebration messages', 'midday check-ins', 'calling her anxious'],
		open_questions=[
			'Has she asked Camila yet?',
			'What would make showing the dummy feel safe?',
			'What does Tomás want from the next year?',
		],
	)
	return [(10, 'claude-sonnet-5', v1), (40, 'claude-opus-5', v2), (75, 'claude-opus-5-5', v3)]


def load_demo(db: DB, now: datetime | None = None, seed: int = SEED) -> None:
	"""Fill an empty database with Noa's 90 days. The learning code runs as the days go by."""
	assert db.message_count() == 0, 'demo data only goes into an empty database'
	rng = random.Random(seed)
	now = (now or datetime.now(UTC)).replace(second=0, microsecond=0)
	tz = ZoneInfo(TZ)
	db.update_settings(timezone=TZ)
	for kind, text in MEMORY:
		db.add_memory(kind, text, source='demo')
	book = db.add_indicator('Hours on the Wind People book', 'h', 6.0)
	pitch = db.add_indicator('Pitches, grant steps or people who saw the work', 'steps', 1.0)
	db.mark_run('indicators_seeded')
	start_local = (now - timedelta(days=DAYS)).astimezone(tz).replace(hour=0, minute=0)
	models = {day: (name, body) for day, name, body in _models()}
	week = {'hours': 0.0, 'pitches': 0, 'done': 0}

	for d in range(DAYS):
		day = start_local + timedelta(days=d)
		day_key = day.date().isoformat()
		travel = rng.random() < 0.22
		energy = max(1, min(5, round(rng.gauss(2.6 if travel else 3.6, 0.8))))
		if rng.random() < 0.85:
			db.set_energy(day_key, energy)

		# her own updates, the way she would say them to Siri
		for _ in range(rng.choice([0, 1, 1, 2])):
			text, tag = rng.choice([u for u in UPDATES if (u[1] == 'travel') == travel] or UPDATES)
			hours = rng.choice([1, 1.5, 2, 2, 3]) if tag == 'book' else 0
			at = day.replace(hour=rng.choice([7, 8, 9, 13, 18, 19]), minute=rng.randrange(60))
			if at.astimezone(UTC) > now:
				continue
			db.add_message('user', text.format(h=f'{hours:g}'), at=at.astimezone(UTC))
			if hours:
				db.log_indicator(book.id, day_key, hours, source='chat')
				week['hours'] += hours
			if tag == 'pitch':
				db.log_indicator(pitch.id, day_key, 1, source='chat')
				week['pitches'] += 1

		# proactive check-ins, chosen by the real learning code from the outcomes so far
		for hour in sorted(rng.sample([8, 9, 11, 12, 13, 15, 16, 17, 18, 19], k=rng.choice([1, 2, 2, 3]))):
			at = day.replace(hour=hour, minute=rng.randrange(60)).astimezone(UTC)
			if at > now - learning.REPLY_WINDOW:
				continue
			history = learning.outcomes(db.all_messages(), at)
			if not learning.receptive_now(history, at, TZ, rng).ok:
				continue
			move = learning.suggest_move(history, rng)
			text = rng.choice(CHECKINS[move]).format(hours=f'{week["hours"]:g}', pitches=week['pitches'])
			msg = db.add_message('mentor', text, kind='checkin', move=move, reason='demo', at=at)
			assert msg is not None
			block = max(b for b in TRUE_RECEPTIVITY if b <= at.astimezone(tz).hour)
			p = min(
				0.95, TRUE_RECEPTIVITY[block] * MOVE_EFFECT[move] * (0.7 if travel else 1.0) + (0.1 if day.weekday() >= 5 else 0)
			)
			if rng.random() < p:
				reply_at = at + timedelta(minutes=rng.randint(4, 70))
				db.add_message('user', rng.choice(REPLIES[move]).format(hours=f'{week["hours"]:g}'), at=reply_at)
				if rng.random() < 0.6:
					db.add_message('mentor', rng.choice(FOLLOWUPS), at=reply_at + timedelta(minutes=1))
				if rng.random() < 0.15:
					db.set_feedback(msg.id, 1)
			elif block == 12 and rng.random() < 0.3:
				db.set_feedback(msg.id, -1)

		# evening reflection and the Sunday review
		evening = day.replace(hour=20, minute=30).astimezone(UTC)
		if evening < now - learning.REPLY_WINDOW and rng.random() < 0.8:
			db.add_message(
				'mentor',
				rng.choice(EVENING),
				kind='evening',
				move='reflection_prompt',
				checkin_key=f'evening:{day_key}',
				at=evening,
			)
			if rng.random() < 0.55:
				db.add_message('user', rng.choice(EVENING_REPLIES), at=evening + timedelta(minutes=rng.randint(5, 50)))
		if day.weekday() == 6:
			sunday = day.replace(hour=18).astimezone(UTC)
			if sunday < now:
				db.add_message(
					'mentor',
					WEEKLY.format(**{k: f'{v:g}' for k, v in week.items()}),
					kind='weekly',
					move='progress_check',
					at=sunday,
				)
				if rng.random() < 0.7:
					db.add_message('user', rng.choice(WEEKLY_REPLIES), at=sunday + timedelta(minutes=rng.randint(10, 60)))
			week = {'hours': 0.0, 'pitches': 0, 'done': 0}

		if d == 60:
			db.add_correction(
				'neuroticism 64/100: anxious under stress',
				'I am not anxious. I am broke when clients pay late. That is different.',
				at=day.astimezone(UTC),
			)
		if d in models:
			name, body = models[d]
			db.save_person_model(
				body,
				built_with=name,
				data_days=d + 1,
				data_messages=db.message_count(),
				at=(day + timedelta(hours=4)).astimezone(UTC),
			)

	for text, due_day, done in COMMITMENTS:
		item = db.add_memory('commitment', text, source='demo', due_at=(start_local + timedelta(days=due_day)).date().isoformat())
		if done:
			db.update_memory(item.id, status='done')
