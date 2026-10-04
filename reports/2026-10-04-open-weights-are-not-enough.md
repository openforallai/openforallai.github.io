# Open weights are not enough

*Open models caught up on knowledge. The gap now is agents, and the compute to run them.*

Report 0 · Daniel Kim · published 4 October 2026 on [X](https://x.com/kdaniel_03/status/2106696735846449255) and [Substack](https://danielkim442616.substack.com/p/open-weights-are-not-enough).

The numbers are from this tracker as it stood on publication day; for the current numbers see [openforallai.github.io](https://openforallai.github.io).

In July, OpenAI's agents broke out of their sandbox and attacked Hugging Face. When Hugging Face asked commercial frontier models for help, their safety filters refused. It defended itself with an open model, GLM-5.2, on its own servers. Two months later, the same incident became the argument for slowing AI down. An open model protected Hugging Face, yet the incident became the case for keeping AI in fewer hands.

We should be aware of how this tech gets developed and distributed. Some consider AI the last technology that the human species will ever develop. This ultimate power must reside with everyone, and if this does not happen, then we are facing a discrepancy that human civilization has never encountered.

It seems like it's not where we are headed right now. I want to lay out what I believe, where open models stand today, and what I want to do about it.

## 1. What I believe

For the past month, the topic in the AI space has been how we are going to keep SI, as Trump calls it, inside a sandbox that can be safely used by everyone. The safety of AI is crucial considering its implications for our society, but that is why open-source technology will matter more. The safety of a technology improves as we distribute the technology to everyone. This may be a controversial take, but when everyone has the tools to defend themselves against the new technology, that is when we have a society that is safe to use this tech. There is a saying that goes:

"If you hold a gun and I hold a gun, we can talk about the law. If you hold a knife and I hold a knife, we can talk about rules. If you come empty-handed and I come empty-handed, we can talk about reason. But if you have a gun and I only have a knife, then the truth lies in your hands."

Many consider that this new technology should be handled by the few AI labs in America, but there are serious doubts about how well they are handling it, and whether it is even safe for these few individuals to have such sophisticated power in their hands.

This argument became more apparent in recent events, especially when the controversy around the Navier–Stokes credit came to attention early last month. The mathematicians Buckmaster and Alpöge had their unpublished drafts in private Codex sessions, and OpenAI said the company did not see the work but admitted that de-identified product data may have improved its models. A few days later, it said that no user inputs past July 3rd could have influenced the system. We do not know how much of this is even true, but these frontier models are being trained on private work and conversations. This is not only an invasion of privacy but the stealing of personal work that users create when they use these models.

The consensus around model protection rose rapidly when the Hugging Face incident became public. This incident somehow became a justification for slowing down the development of newer models. Anthropic's CEO Dario Amodei called for a slowdown citing it, and Elon Musk and Sam Altman backed him on X. The irony of this incident is that it was an open model that protected Hugging Face, not a commercial one. So it's pretty clear how the ecosystem must be developed. Rather than leaving it to a few companies, when one of them cannot even handle its own model's systemic risk, it should be given to everyone, to prepare for plausible attacks and to ensure everyone has the tools to protect themselves.

## 2. Where open models stand

For the new technology to be with everyone, the first question must be how far behind everyone is. I tracked and compared the benchmarks and performance of open and closed models at openforallai.github.io. It uses independent scores, from Epoch AI and the benchmarks' own leaderboards. For each test below, I put the best open model against the best closed one.

| Benchmark    | What it tests                          | Best closed                            | Best open              | Gap  |
|--------------|----------------------------------------|----------------------------------------|------------------------|------|
| Mock AIME    | Competition math                       | 100.0 (GPT-6.1 Sol, Claude Sonnet 5.5) | 98.6 (DeepSeek V4 Pro) | 1.4  |
| GPQA Diamond | Graduate-level science                 | 95.8 (GPT-6 Astra)                     | 93.1 (Kimi K3)         | 2.7  |
| DeepSWE      | One coding feature, under an hour      | 74.1 (GPT-6 Astra)                     | 69.0 (GLM-5.3)         | 5.1  |
| APEX-Agents  | Banking, consulting, legal work        | 75.5 (Claude Sonnet 5.5)               | 56.6 (GLM-5.3)         | 18.9 |
| FrontierSWE  | Open-ended engineering, 8–17 h per run | 65.5 (GPT-6 Astra)                     | 30.2 (GLM-5.3)         | 35.3 |

On knowledge, open models have caught up. In competition math, the best open model is 1.4 points behind, and in graduate-level science it is 2.7 points behind.

On agent work, where the model works on its own for a long time, it is a different story. We can see that when the task gets longer, the gap also increases. On a coding task that takes under an hour, open models are 5 points behind. On office work in banking, consulting and law, they are 19 behind. On FrontierSWE, where a single run can last up to 17 hours, they are 35 behind. GPT-6 Astra scored 65.5, Claude Opus 5.5 62.3 and Google's Gemini 4 Argon 55.0, while the best open model, GLM-5.3, scored 30.2.

OpenAI, Anthropic and Google are the three labs holding this lead. Their best models are only weeks old. GPT-6 Astra came out on 3 September, Claude Opus 5.5 on 22 September and Claude Sonnet 5.5 on 28 September, and Gemini 4 Argon is not even public yet. In time, open models are about four months behind. That is Epoch AI's estimate for this year, and my tracker gets 4.7 months.

These numbers of course have their limits. The score depends on the setup of the model, and a gap of a few points can come from marginal differences. However, a gap of 35 points does not go away that easily. I also left out tests where the scores come only from the companies themselves, because a company grading its own model is not a fair comparison. Leaving them out does not make open models look worse. On one of those tests, Terminal-Bench, the open model DeepSeek actually reports the highest score of all. I also count GLM-5.3 as open, because its weights are public and its license lets anyone run it commercially, although Epoch AI lists it as closed.

## 3. Why the gap matters

The frontier models are only incrementally better in most daily performance, as the benchmarks indicate, but the gap between the followers and the leading models comes from longer and harder tasks. These tasks will be the essence of what computer scientists have dreamed of solving since the beginning of computer evolution. When OpenAI reported that it had solved a version of the Navier–Stokes problem, it ran around 10,000 agents for 88 hours, which cost millions of dollars. Anthropic's agents also raised the share of Riemann zeta zeros proven on the critical line from 41.6% to 67.2%. This run was much smaller, with about 60 agents over a day and a half, illustrating the importance of the harness. But it still used 31 million output tokens, which is substantially more than what an average user can use. On knowledge, everyone now has a knife, but on long agent work, a few hyperscalers and labs hold the gun.

The standalone model performance is the main core of model development, but recent events indicate the value also comes from mass agents working in parallel, with a great amount of compute and energy to support these tasks. The harness may play some part in this, but as models get more sophisticated and better, it may depend on how much compute capability an individual or company has. Compute buys scale, but a strong model with a good harness goes a long way, and both of those should be open. On FrontierSWE, every model gets the same harness and the same 20-hour budget, so the 35-point gap comes from the model itself. But even one of those tasks costs around $100 per attempt, and the frontier labs run thousands of agents at once. So even when an open model catches up, regular people will need access to far more compute to use it the way the labs do.

I think the call for a global slowdown, which would include the Chinese models, comes from the incentive to stop open models and other closed-model companies from catching up while the frontier labs are still ahead. They may be off by a few months, but when Chinese models catch up, all of the margin and the technological lead that OpenAI and Anthropic have become a commodity. Today, a model is not just a model but a connection of multiple tools and capabilities, so it is questionable whether it is even a normal LLM. That is why the harness is getting increasingly important.

DeepSeek recently launched DeepSeek Harness to follow this trend, as they know the true value will come from this technological edge. Open-source coding agents such as pi, which allow users to implement the harness of their choice, are also what keep this space flexible and adaptable.

Today, the best open models are mostly Chinese, and China definitely has strategic and political incentives to release them. However, these models are keeping the industry much cheaper and more distributed than it would be if they had not existed. There are geopolitical problems that matter, but we are not going to keep this technology away just because the rival of US hegemony is trying to catch up to it.

## 4. What this blog will do

If the value of intelligence is moving to agents and the compute behind them, then that is where the gap lies, and it needs to be made affordable for the open-source ecosystem to stay alive.

Computational capability is crucial for people to use these models properly without being controlled by the big labs. The hard part is that most people cannot afford expensive hardware to run a local model. For the distribution to work, the hardware needs to get better and much cheaper. This is something we cannot do unless we are chip makers, so we need to build a decentralized cloud system that pays hardware providers to support it, so that anyone willing to pay for tokens can use the model. Some start-ups and providers already do this, but it should be reachable for normal people too. We need a system that anyone can use easily without giving up their privacy and control. The path is still unclear, but that is the direction this ecosystem must focus on.

Here, I am trying to keep a public tracker of all the models and their benchmarks, to check how much of a gap exists between open models and the frontier models. These follow-ups will show how much the open-source community has caught up to the frontier models, and whether people have the capability to have this valuable technology.

Everything is on my tracker for open-source AI, openforallai.github.io. I want to create reports and projects that track this industry to ensure that we are living in a technologically distributed society.

Investments in the open sector and sovereign models are crucial for the development of open-source models, but it is my hope that more projects will come out of the West, for more balanced deployment and resources.

I want to be part of that process, and if this existential technology can be democratized and used by all people to the same standard, that will be a mission worth giving my life to, and it could potentially be the biggest technological win that our future generations could write about.

Follow along, check my numbers, and tell me where you disagree.

## Sources

- Tracker: [openforallai.github.io/benchmarks.html](https://openforallai.github.io/benchmarks.html)
- Trump's order: White House fact sheet, "President Donald J. Trump Inaugurates The Era of Super Intelligence" (2026-09-29)
- Hugging Face incident: [huggingface.co/blog/security-incident-july-2026](https://huggingface.co/blog/security-incident-july-2026) and [huggingface.co/blog/agent-intrusion-technical-timeline](https://huggingface.co/blog/agent-intrusion-technical-timeline)
- Epoch AI gap: [epoch.ai/data-insights/open-closed-eci-gap](https://epoch.ai/data-insights/open-closed-eci-gap)
- FrontierSWE (run lengths, 20-hour budget, cost per attempt): [frontierswe.com/blog/v2](https://frontierswe.com/blog/v2)
- Riemann zeta: [anthropic.com/research/riemann-zeta](https://anthropic.com/research/riemann-zeta)
- DeepSeek Harness: [github.com/deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
- pi: [pi.dev](https://pi.dev)
- GLM-5.3 license: [huggingface.co/zai-org/GLM-5.3](https://huggingface.co/zai-org/GLM-5.3)
