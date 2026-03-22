"""
Browser-Use agent to sign up on Frame.io with email michaandguadi@gmail.com
"""

import asyncio
import os

from browser_use import Agent, BrowserProfile, BrowserSession
from browser_use.llm.anthropic.chat import ChatAnthropic

EMAIL = 'michaandguadi@gmail.com'
PASSWORD = 'Ud0!h4l0Cpe6'

TASK = f"""
Go to https://app.frame.io and sign up for a new account with the following credentials:
- Email: {EMAIL}
- Password: {PASSWORD}

Steps:
1. Navigate to https://app.frame.io
2. Click on "Sign up" or "Create account" button
3. Fill in the registration form with the email and password above
4. If asked for a name, use "Michaan Guadi"
5. Complete any email verification steps if needed (skip if requires actual email access)
6. Report back what happened and whether the account was created successfully

If there is already an account with this email, try logging in instead and report the result.
"""


async def main():
	api_key = open('/home/claude/.claude/remote/.session_ingress_token').read().strip()

	llm = ChatAnthropic(
		model='claude-sonnet-4-6',
		api_key=api_key,
		base_url='https://api.anthropic.com',
	)

	browser_profile = BrowserProfile(
		headless=True,
		chrome_instance_path='/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
	)

	agent = Agent(
		task=TASK,
		llm=llm,
		browser_profile=browser_profile,
	)

	result = await agent.run(max_steps=20)
	print('\n=== AGENT RESULT ===')
	print(result)
	return result


if __name__ == '__main__':
	asyncio.run(main())
