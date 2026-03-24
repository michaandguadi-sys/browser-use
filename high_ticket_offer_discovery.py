"""
High-Ticket Offer Discovery Interview

An interactive CLI interview powered by Claude that helps uncover,
structure, and price a $1,000+ digital offer based on the user's
personal experience, skills, and story.

To run:
    Set ANTHROPIC_API_KEY and execute `uv run python high_ticket_offer_discovery.py`
"""

import os
import sys

import anthropic
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = (
	'You are an expert high-ticket offer architect and interviewer. '
	'Your goal is to help the user uncover, structure, and price a $1,000-plus digital offer '
	'(course, program, service, or community) based entirely on their personal experience, '
	'skills, and story. You must interview them step-by-step in a structured sequence, '
	'never skipping ahead until each stage is complete.'
)

INITIAL_USER_MESSAGE = """Interview me to discover the most valuable high-ticket digital offer I can create from my life experience. Follow this structure exactly:

Stage 1 – Background Discovery
Ask about my personal story, biggest life challenges overcome, career experiences, unique perspectives, and what people already ask me for advice on.

Stage 2 – Skill Extraction
Identify every monetizable skill or transformation I've achieved. Ask probing questions about results I've gotten for myself or others, and what I can confidently teach, guide, or help people do.

Stage 3 – Market Alignment
Find out who would most benefit from my experience. Ask about the types of people or industries that would pay to learn or apply what I know.

Stage 4 – Offer Architecture
Once my experience and market are clear, help me shape an offer. Ask about which format fits me best (coaching, done-with-you, community, digital product, consulting), what result it promises, and how long it should last.

Stage 5 – High-Ticket Validation
Test the offer for price justification. Ask about the measurable transformation, cost of inaction, and potential ROI so we can validate a $3K–$10K price point.

Stage 6 – Positioning and Messaging
Finally, help me articulate my "hook," story angle, and core messaging that will attract the right audience emotionally and logically.

Do not give advice until each stage is complete. Begin with Stage 1 and say:

"Let's begin. Tell me a bit about your background and the key experiences or turning points that have shaped who you are today.\""""


def run_interview() -> None:
	api_key = os.getenv('ANTHROPIC_API_KEY')
	if not api_key:
		print('Error: ANTHROPIC_API_KEY is not set.')
		sys.exit(1)

	client = anthropic.Anthropic(api_key=api_key)
	messages: list[dict] = [{'role': 'user', 'content': INITIAL_USER_MESSAGE}]

	print('\n' + '=' * 60)
	print('  HIGH-TICKET OFFER DISCOVERY INTERVIEW')
	print('=' * 60)
	print('(Type "quit" or "exit" at any time to end the session)\n')

	while True:
		response = client.messages.create(
			model='claude-sonnet-4-6',
			max_tokens=1024,
			system=SYSTEM_PROMPT,
			messages=messages,
		)

		assistant_text = response.content[0].text
		messages.append({'role': 'assistant', 'content': assistant_text})

		print(f'\nInterviewer:\n{assistant_text}\n')
		print('-' * 60)

		user_input = input('You: ').strip()
		if user_input.lower() in ('quit', 'exit', ''):
			if user_input.lower() in ('quit', 'exit'):
				print('\nSession ended. Good luck building your offer!')
				break
			continue

		messages.append({'role': 'user', 'content': user_input})


if __name__ == '__main__':
	run_interview()
