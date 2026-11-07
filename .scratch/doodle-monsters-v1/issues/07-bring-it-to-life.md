# 07: Bring it to life

**What to build:** Between drawing and the Catch, the kid brings their Monster to life. They stick 1 to 5 Googly Eyes on it (and can move or remove them), pick a Temperament from a short list shown as a word plus an icon, and get a generated name they can reroll with 🎲 or type themselves. The Googly Eyes jiggle when the Monster moves during the Catch. The Catch starts once it has eyes, a Temperament and a name.

**Blocked by:** 06 (Draw your Monster).

**Status:** ready-for-agent

- [ ] The kid can place 1 to 5 Googly Eyes on the drawing and move or remove them; positions are stored relative to the image
- [ ] Temperament picker with the starting list (something like Speedy, Sneaky, Bouncy, Sturdy, Sleepy), each shown as a word plus an icon
- [ ] Name generator fills in blanks from kid-safe word lists kept as data; 🎲 rerolls; the name can be edited by typing
- [ ] Starting the Catch is only possible with at least one Googly Eye, a Temperament and a name
- [ ] Googly Eyes jiggle when the Monster moves during the Catch
- [ ] Core: the Round goes Draw → Bring to life → Catch; tests cover the 1–5 eye limit, needing a Temperament and a name, and "the same dice gives the same name"
