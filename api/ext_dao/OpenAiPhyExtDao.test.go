package extdao

// import base64
// from openai import OpenAI
// import json
// from datetime import datetime

// client = OpenAI()

// def encode_image(image_path: str) -> str:
//     with open(image_path, "rb") as f:
//         return base64.b64encode(f.read()).decode("utf-8")

// def encode_image_to_data_url(path: str) -> str:
//     with open(path, "rb") as f:
//         b64 = base64.b64encode(f.read()).decode("utf-8")
//     return f"data:image/jpeg;base64,{b64}"

// def save_json(data, prefix: str):

//     ts = datetime.now().strftime("%Y%m%d_%H%M%S")
//     filename = f"{prefix}_{ts}.json"

//     with open(filename, "w", encoding="utf-8") as f:
//         json.dump(data, f, ensure_ascii=False, indent=2)

//     return filename

// PROMPT = """
// You are an expert facial feature analyst.

// Analyze the given face image and extract physiognomic features
// STRICTLY following the definitions and categories below.

// ========================
// Eyebrows (ëˆˆì¹)
// ========================
// {
//   "thickness": "thick | thin",
//   "shape": "straight | arched | angled",
//   "length": "longer_than_eye | shorter_than_eye",
//   "distance_from_eye": "close | far",
//   "neatness": "neat | messy",
//   "tail_direction": "upward | downward"
// }

// Definitions:
// - thickness: overall visual density of the eyebrows
// - shape:
//   - straight: mostly horizontal
//   - arched: curved like an arc
//   - angled: has a noticeable sharp angle
// - length:
//   - longer_than_eye: eyebrow extends beyond the outer corner of the eye
//   - shorter_than_eye: eyebrow ends before the outer corner of the eye
// - distance_from_eye:
//   - close: eyebrow sits close to the eye
//   - far: noticeable gap between eyebrow and eye
// - neatness:
//   - neat: well-aligned and orderly
//   - messy: uneven or scattered hairs
// - tail_direction:
//   - upward: tail rises upward
//   - downward: tail slopes downward

// ========================
// Eyes (ëˆˆ)
// ========================
// {
//   "size": "large | medium | small",
//   "shape": "round | almond | narrow",
//   "eye_tail_direction": "upward | downward | neutral",
//   "distance_between_eyes": "wide | average | narrow",
//   "eyelid_type": "double | single | inner_double"
// }

// ========================
// Nose (ì½”)
// ========================
// {
//   "bridge_height": "high | medium | low",
//   "bridge_width": "wide | medium | narrow",
//   "tip_shape": "rounded | pointed | flat",
//   "nostril_visibility": "high | medium | low"
// }

// ========================
// Mouth (ìž…)
// ========================
// {
//   "lip_thickness": "thick | medium | thin",
//   "mouth_width": "wide | medium | narrow",
//   "mouth_corner_direction": "upward | downward | neutral"
// }

// ========================
// Face Shape (ì–¼êµ´í˜•)
// ========================
// "face_shape": "oval | round | square | long | heart | diamond"

// ========================
// Final Output Format
// ========================

// Return ONLY the following JSON structure:

// {
//   "eyebrows": { ... },
//   "eyes": { ... },
//   "nose": { ... },
//   "mouth": { ... },
//   "face_shape": "...",
//   "notes": "brief explanation of any uncertainty due to hair, pose, lighting, or image resolution"
// }

// IMPORTANT:
// - Do NOT add explanations outside JSON
// - Use ONLY allowed enum values
// """

// def extract_face_features(image_path: str):
//     image_data_url = encode_image_to_data_url(image_path)

//     response = client.responses.create(
//         model="gpt-4.1-mini",
//         input=[
//             {
//                 "role": "user",
//                 "content": [
//                     {
//                         "type": "input_text",
//                         "text": PROMPT
//                     },
//                     {
//                         "type": "input_image",
//                         "image_url": image_data_url
//                     }
//                 ]
//             }
//         ],
//         temperature=0
//     )

//     return json.loads(response.output_text)

// # def save_json(result_text: str,imageName: str, output_path: str = None):
// #     """
// #     result_text: model output (JSON string)
// #     output_path: ì €ìž¥í•  íŒŒì¼ ê²½ë¡œ (Noneì´ë©´ timestamp ê¸°ë°˜ ìžë™ ìƒì„±)
// #     """

// #     # JSON ë¬¸ìžì—´ â†’ dict
// #     data = json.loads(result_text)
// #     imageName = imageName.split(".")[0]

// #     # íŒŒì¼ëª… ìžë™ ìƒì„±
// #     if output_path is None:
// #         ts = datetime.now().strftime("%Y%m%d_%H%M%S")
// #         output_path = f"{imageName}_{ts}.json"

// #     # JSON íŒŒì¼ ì €ìž¥
// #     with open(output_path, "w", encoding="utf-8") as f:
// #         json.dump(data, f, ensure_ascii=False, indent=2)

// #     return output_path

// def parse_llm_json(text: str) -> dict:
//     if not text or not text.strip():
//         raise ValueError("LLM returned empty output")

//     text = text.strip()

//     # 1. ë°”ë¡œ JSON ì‹œë„
//     try:
//         return json.loads(text)
//     except json.JSONDecodeError:
//         pass

//     # 2. JSON ë¸”ë¡ë§Œ ì¶”ì¶œ
//     start = text.find("{")
//     end = text.rfind("}") + 1

//     if start == -1 or end == 0:
//         raise ValueError(f"No JSON object found in LLM output:\n{text}")

//     try:
//         return json.loads(text[start:end])
//     except json.JSONDecodeError as e:
//         raise ValueError(f"JSON parsing failed:\n{text}") from e

// def interpret_physiognomy(face_features: dict) -> dict:
//     INTERPRET_PROMPT_TEMPLATE = f"""
//     You are a physiognomy-based personality and relationship analyst.

//     Rules:
//     - Descriptive, not deterministic
//     - No fortune-telling or destiny
//     - Use words like "tends to", "likely", "may"

//     Facial Features (JSON):
//     {json.dumps(face_features, ensure_ascii=False, indent=2)}

//     Tasks:
//     1. One-line summary of what kind of person this appears to be
//     2. Personality profile
//     3. Romantic tendencies
//     4. Ideal partner from a physiognomic compatibility perspective
//     5. must be in Korean
//     6. generate a nickname based on the 'one_line_person_summary'
//     7. 'content' column explains overall impression based on facial features(physiognomy)

//     Return ONLY valid JSON:

//     {{
//       "sex": "...",
//       "age": "...",
//       "nickname": "...",
//       "one_line_person_summary": "...",
//       "content": "...",
//       "personality_profile": {{
//         "core_traits": "...",
//         "emotional_style": "...",
//         "social_style": "..."
//       }},
//       "romantic_tendencies": {{
//         "relationship_style": "...",
//         "what_they_value_in_partner": "...",
//         "potential_challenges": "..."
//       }},
//       "ideal_partner_physiognomy": {{
//         "one_line_summary": "...",
//         "facial_feature_preferences": {{
//           "eyes": "...",
//           "nose": "...",
//           "mouth": "...",
//           "face_shape": "..."
//         }},
//         "personality_match": "..."
//       }}
//     }}
//     """

//     response = client.responses.create(
//         model="gpt-4.1-mini",
//         input=INTERPRET_PROMPT_TEMPLATE,
//         temperature=0.6
//     )

//     return parse_llm_json(response.output_text)

// def build_image_prompt(user_data: dict) -> str:
//     # ì„±ë³„ ë°˜ì „
//     user_sex = user_data["sex"].lower()
//     partner_sex = "man" if user_sex == "female" else "woman"

//     # ë‚˜ì´: 2~3ì‚´ ì–´ë¦¬ê²Œ
//     age = user_data.get("age", 25)
//     partner_age = f"{age - 3}" #f"{age - 3}â€“{age - 2}"

//     prefs = user_data["ideal_partner_physiognomy"]["facial_feature_preferences"]

//     prompt = f"""
//     Generate a realistic portrait of a young adult {partner_sex} around {partner_age} years old.
//     but with a youthful and strongly boyish/girlish appearance that makes him/her look younger than their age.

//     A person gives a warm, trustworthy, emotionally stable, and approachable impression.
//     Her/his overall facial balance feels gentle and harmonious rather than sharp.

//     Facial features:
//     - Eyes: {prefs['eyes']}
//     - Nose: {prefs['nose']}
//     - Lips: {prefs['mouth']}
//     - Face shape: {prefs['face_shape']}

//     Hairstyle (matched to facial impression):
//     - Choose a hairstyle that enhances her gentle and trustworthy physiognomy
//     - Recommended styles:
//       - medium to long hair with soft waves
//       - natural side or center part (not sharp or extreme)
//       - softly layered cut that frames the face
//     - Avoid overly sharp, heavy, or aggressive styling
//     - Hair texture should look natural, healthy, and effortless

//     Outfit & styling (physiognomy-friendly coordination):
//     - Outfit should visually reinforce her warm, calm, and reliable impression
//     - Preferred clothing styles:
//       - light knit top, fine-gauge sweater, or soft cardigan
//       - sleeveless or short-sleeve top with clean, elegant lines
//       - simple blouse with minimal structure
//     - Fit should be relaxed and natural (not tight, not oversized)
//     - Colors:
//       - warm neutrals, soft beige, ivory, light brown, muted pastel tones
//     - Avoid bold patterns or harsh contrasts
//     - Accessories (optional):
//       - small earrings, delicate necklace
//       - minimal and refined, never flashy

//     Background / Location (matched to facial impression and styling):
//     - Choose a location that naturally complements her calm and trustworthy appearance
//     - The setting should feel refined, modern, and emotionally comfortable
//     - Suitable locations include:
//       - modern cafÃ© with warm wood and soft natural light
//       - minimal interior space with neutral tones and subtle texture
//       - clean studio background with a soft gradient (warm gray, beige)
//     - Background must enhance facial harmony without drawing attention away

//     Overall vibe:
//     - Warm
//     - Trustworthy
//     - Emotionally stable
//     - Youthful but mature
//     - Calm, refined, and approachable

//     Image requirements:
//     - Output image size: exactly 300 Ã— 300 pixels
//     - Square aspect ratio (1:1)
//     - Head-and-shoulders framing
//     - Subject centered with balanced margins
//     - Face occupies approximately 65â€“70% of the frame

//     Style:
//     - Photorealistic portrait
//     - Natural skin texture (no over-smoothing)
//     - Minimal, natural grooming
//     - Soft, diffused lighting (daylight-like)
//     - Shallow depth of field
//     - Modern East Asian aesthetics
//     - High-quality, realistic appearance within a 300Ã—300 image
//     """

//     return prompt.strip()

// def save_base64_image(image_base64: str, output_path: str):
//     image_bytes = base64.b64decode(image_base64)
//     with open(output_path, "wb") as f:
//         f.write(image_bytes)

// def generate_ideal_partner_image(user_data: dict, output_path="ideal_partner.png"):
//     prompt = build_image_prompt(user_data)
//     print("\n=== USED PROMPT ===\n")
//     print(prompt)

//     result = client.images.generate(
//         # model="gpt-image-1",
//         model="gpt-image-1-mini",
//         prompt=prompt,
//         size="300x300"
//     )

//     image_base64 = result.data[0].b64_json
//     image_bytes = base64.b64decode(image_base64)

//     with open(output_path, "wb") as f:
//         f.write(image_bytes)

//     print(f"âœ” Ideal partner image saved to {output_path}")

// # =========================
// # 3. Main Pipeline
// # =========================
// def run_pipeline(image_path: str):
//     gender = "male"
//     age = 35

//     print("â–¶ Extracting facial features...")
//     features = extract_face_features(image_path)
//     feature_file = save_json(features, "face_features")
//     print(f"  âœ” Features saved to {feature_file}")

//     print("â–¶ Interpreting physiognomy...")

//     features['sex'] = gender

//     interpretation = interpret_physiognomy(features)
//     interpretation['sex'] = gender
//     interpretation['age'] = age
//     interpretation_file = save_json(interpretation, "physiognomy_interpretation")
//     print(f"  âœ” Interpretation saved to {interpretation_file}")

//     # generate_ideal_partner_image(interpretation) # image generator agent authorification í•„ìš”
//     prompt = build_image_prompt(interpretation) # todo comment!
//     print("\n=== USED PROMPT ===\n")
//     print(prompt)

//     return {
//         "features": features,
//         "interpretation": interpretation
//     }

// # =========================
// # Entry Point
// # =========================
// if __name__ == "__main__":
//     # IMAGE_PATH = "han.jpg"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "downward.png"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "thick.png"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "thick_partner.png"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "girl.jpg"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "downward_idealpartner.png"
//     # IMAGE_PATH = "thin.png"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     IMAGE_PATH = "dean.jpg"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "dean2_long.jpg"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "lim.jpg"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "moon.jpg"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "moon2.jpg"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "noa.png"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     # IMAGE_PATH = "shim.jpg"  # ì–¼êµ´ ì´ë¯¸ì§€ ê²½ë¡œ
//     result = run_pipeline(IMAGE_PATH)

//     print("\n=== ONE-LINE SUMMARY ===")
//     print(result['interpretation'])
