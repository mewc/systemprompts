# systemprompts

A research project.

To track the responses of inquiries into system prompts from the main ai llm models over time.

## How it Works

- Runs daily GitHub Actions workflow
- Fetches system prompts from various AI models in a github action
- Archives prompts with timestamps in a structured format
- Maintains history of changes over time in the repo publically

## Supported Providers & Models

[see here](./src/providers.ts)

## Security Notes

- Only tracks publicly available system prompts
- No API keys or private credentials stored in the repository
- All data sourced from official public channels

## Contribute

Want more models? More detail

## TODO

- randomisation of prompts to a/b test
- follow up questions
- ...etc

## Credits

idea: https://x.com/NickADobos/status/1893872882658193729
inspo: https://github.com/statsig-io/statuspage 

# Contact

leave an issue here, [or dm me](https://x.com/the_mewc)

## Appendix

Get your api gets for providers here: 

- https://console.anthropic.com/settings/keys
- https://platform.openai.com/api-keys
- https://console.x.ai/
- https://aistudio.google.com/app/apikey


[![](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/mewc)
