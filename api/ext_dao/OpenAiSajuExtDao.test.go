package extdao

// # 1. Need to install libraries
// # pip install eacal pytz openai
// import json
// from datetime import datetime
// from typing import Dict, Any
// import pytz
// import eacal
// from openai import OpenAI

// def save_json(data, prefix: str):

//     ts = datetime.now().strftime("%Y%m%d_%H%M%S")
//     filename = f"{prefix}_{ts}.json"

//     with open(filename, "w", encoding="utf-8") as f:
//         json.dump(data, f, ensure_ascii=False, indent=2)

//     return filename

// # =========================
// # OpenAI Client
// # =========================
// client = OpenAI()

// # =========================
// # GPT Prompt
// # =========================
// def build_prompt(saju: Dict[str, Any]) -> str:
//     return f"""
// You are a Saju (Four Pillars / Eight Characters) based personality and relationship analyst.

// Rules:
// - Write EVERYTHING in Korean
// - Descriptive, not deterministic
// - No fortune-telling, fate, wealth, health, or lifespan claims
// - Focus on tendencies, patterns, and interpersonal dynamics
// - Friendly and slightly witty tone
// - Output ONLY valid JSON

// Important Interpretation Rules:
// - The primary source for Saju interpretation is "palja" (the Eight Characters).
// - Interpret Saju based on the relationships between the Heavenly Stems and Earthly Branches
//   (e.g., balance, contrast, flow, repetition).
// - "birth" information is provided ONLY as supplementary context
//   (such as age range or generational background),
//   and MUST NOT override or replace palja-based interpretation.
// - Do NOT calculate or infer missing pillars.
// - Do NOT reinterpret palja order.

// Input:
// - Gender: {saju['sex']}
// - Birth information (for age/generation context only): {saju['birth']}
// - Palja (Eight Characters as structured data): {saju['palja']}

// Additionally, the Four Pillars are provided as a single string
// in the following FIXED order:
// Year Pillar â†’ Month Pillar â†’ Day Pillar â†’ Hour Pillar

// Format:
// "YEAR_PILLAR / MONTH_PILLAR / DAY_PILLAR / HOUR_PILLAR"

// Interpretation Guidelines:
// - Treat the Day Pillar as the ì¤‘ì‹¬ ì¶• for personality tendencies.
// - Observe how Year/Month/Hour pillars support, contrast, or soften the Day Pillar.
// - Describe balance, emphasis, and interaction â€” NOT outcomes or destiny.
// - Use metaphorical and narrative language rather than technical jargon.

// Tasks:
// 1. One-line Saju summary
// 2. Detailed personality analysis based on palja structure
// 3. Romantic tendencies and relationship dynamics
// 4. Ideal partner Saju type (descriptive compatibility, not prediction)
// 5. Short witty nickname inspired by the overall Saju impression
// 6. 'content' column explains overall impression based on facial features(physiognomy)

// Return ONLY the following JSON structure:

// {{
//   "nickname": "...",
//   "sex": "...",
//   "age": ...,
//   "one_line_saju_summary": "...",
//   "content": "...",
//   "saju_personality_profile": {{
//     "core_traits": "...",
//     "emotional_style": "...",
//     "life_attitude": "..."
//   }},
//   "romantic_tendencies": {{
//     "relationship_style": "...",
//     "what_they_seek_in_partner": "...",
//     "potential_challenges": "..."
//   }},
//   "ideal_partner_saju": {{
//     "one_line_summary": "...",
//     "saju_characteristics": "...",
//     "why_it_matches": "..."
//   }},
//   "notes": "ì‚¬ì£¼íŒ”ìž êµ¬ì¡°ë¥¼ ë°”íƒ•ìœ¼ë¡œ í•œ ê²½í–¥ ì¤‘ì‹¬ í•´ì„"
// }}

// """.strip()

// # =========================
// # Pipeline
// # =========================
// def run_pipeline(gender: str, birth: str = None, palja: str = None) -> Dict[str, Any]:

//     saju = {
//         "birth": birth,
//         "palja": palja,
//         "sex": gender
//     }

//     prompt = build_prompt(saju)

//     resp = client.responses.create(
//         model="gpt-4.1-mini",
//         input=prompt,
//         temperature=0.6
//     )

//     text = resp.output_text.strip()
//     start, end = text.find("{"), text.rfind("}") + 1
//     result = json.loads(text[start:end])
//     result["_saju_input"] = saju
//     return result

// # =========================
// # Entry Point
// # =========================
// if __name__ == "__main__":
//     # Case 1: birth input
//     gender="male"
//     # birth="198212010250"
//     # palja="ìž„ìˆ ì‹ í•´ì •ë¬˜ê²½ìž"

//     birth="199011241030"
//     palja="ê²½ì˜¤ì •í•´ê³„ì‚¬ì •ì‚¬"

//     result = run_pipeline(gender, birth=birth,palja=palja)
//     save_json(result, f"saju_interpretation_{gender}_{birth}_{palja}")
//     print(result)
