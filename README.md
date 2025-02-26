# systemprompts

what are the system prompts of the main LLM models, and how do they change over time?

## How it Works

- Runs daily GitHub Actions workflow
- Fetches system prompts from various AI models (where publicly available)
- Archives prompts with timestamps in a structured format
- Maintains history of changes over time

## Supported Models

Currently tracking:
- Grok (publicly available)
- Claude (when available via official channels)
- Other models (as they become publicly accessible)

## Security Notes

- Only tracks publicly available system prompts
- No API keys or private credentials stored in the repository
- All data sourced from official public channels

## Contributing

Feel free to submit PRs for:
- New model additions
- Prompt updates
- Source improvements

## Data Structure

Prompts are stored in `data/prompts` with the following structure:

## Credits

idea: https://x.com/NickADobos/status/1893872882658193729
inspo: https://github.com/statsig-io/statuspage 


## Appendix

Get your api gets for providers here: 

- https://console.anthropic.com/settings/keys
- https://platform.openai.com/api-keys
- https://console.x.ai/
- https://aistudio.google.com/app/apikey
