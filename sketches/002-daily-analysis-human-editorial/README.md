## Variant: 002-daily-analysis-human-editorial

### Design stance
降低儀表板密度，讓 Daily Analysis 先像人類研究員說話，再讓證據與來源狀態退到第二層。

### Key choices
- 真實中文敘述優先，不用工程狀態當主標題。
- 產品、題材角色、SWOT、研調背景保留，但改成可展開/側欄/證據摘要。
- 來源 freshness 是信任 metadata，不是主內容。

### Trade-offs
- Strong at: 可讀性、信任感、降低資訊焦慮。
- Weak at: 一屏掃大量標的的效率較低，需要後續加篩選/列表模式。
