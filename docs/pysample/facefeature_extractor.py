import base64
from openai import OpenAI
import json
from datetime import datetime

client = OpenAI()

def encode_image(image_path: str) -> str:
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def encode_image_to_data_url(path: str) -> str:
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def save_json(data, prefix: str):

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{ts}.json"

    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return filename

PROMPT = """
You are an expert facial feature analyst.

Analyze the given face image and extract physiognomic features
STRICTLY following the definitions and categories below.

========================
Eyebrows (눈썹)
========================
{
  "thickness": "thick | thin",
  "shape": "straight | arched | angled",
  "length": "longer_than_eye | shorter_than_eye",
  "distance_from_eye": "close | far",
  "neatness": "neat | messy",
  "tail_direction": "upward | downward"
}

Definitions:
- thickness: overall visual density of the eyebrows
- shape:
  - straight: mostly horizontal
  - arched: curved like an arc
  - angled: has a noticeable sharp angle
- length:
  - longer_than_eye: eyebrow extends beyond the outer corner of the eye
  - shorter_than_eye: eyebrow ends before the outer corner of the eye
- distance_from_eye:
  - close: eyebrow sits close to the eye
  - far: noticeable gap between eyebrow and eye
- neatness:
  - neat: well-aligned and orderly
  - messy: uneven or scattered hairs
- tail_direction:
  - upward: tail rises upward
  - downward: tail slopes downward

========================
Eyes (눈)
========================
{
  "size": "large | medium | small",
  "shape": "round | almond | narrow",
  "eye_tail_direction": "upward | downward | neutral",
  "distance_between_eyes": "wide | average | narrow",
  "eyelid_type": "double | single | inner_double"
}

========================
Nose (코)
========================
{
  "bridge_height": "high | medium | low",
  "bridge_width": "wide | medium | narrow",
  "tip_shape": "rounded | pointed | flat",
  "nostril_visibility": "high | medium | low"
}

========================
Mouth (입)
========================
{
  "lip_thickness": "thick | medium | thin",
  "mouth_width": "wide | medium | narrow",
  "mouth_corner_direction": "upward | downward | neutral"
}

========================
Face Shape (얼굴형)
========================
"face_shape": "oval | round | square | long | heart | diamond"

========================
Final Output Format
========================

Return ONLY the following JSON structure:

{

  "eyebrows": { ... },
  "eyes": { ... },
  "nose": { ... },
  "mouth": { ... },
  "face_shape": "...",
}

IMPORTANT:
- Do NOT add explanations outside JSON
- Use ONLY allowed enum values
"""



def extract_face_features(image_path: str):
    image_data_url = encode_image_to_data_url(image_path)

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": PROMPT
                    },
                    {
                        "type": "input_image",
                        "image_url": image_data_url
                    }
                ]
            }
        ],
        temperature=0
    )

    return json.loads(response.output_text)



def parse_llm_json(text: str) -> dict:
    if not text or not text.strip():
        raise ValueError("LLM returned empty output")

    text = text.strip()

    # 1. 바로 JSON 시도
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. JSON 블록만 추출
    start = text.find("{")
    end = text.rfind("}") + 1

    if start == -1 or end == 0:
        raise ValueError(f"No JSON object found in LLM output:\n{text}")

    try:
        return json.loads(text[start:end])
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON parsing failed:\n{text}") from e


def interpret_physiognomy(face_features: dict) -> dict:
    INTERPRET_PROMPT_TEMPLATE = f"""
    You are a physiognomist.

    Rules:
    - Descriptive, not deterministic
    - Use words like "tends to", "likely", "may"
    - 'summary','partner_summary','content','personality_match' must write in Korean.
    - face feature preferences must write in English using the same categories and definitions as input.
    
    Input: My information
    - sex: {face_features['sex']}
    - age: {face_features['age']}

    
    Facial Features (JSON):
    {json.dumps(face_features, ensure_ascii=False, indent=2)}

    Tasks:
    1. One-line summary of what kind of person this appears to be
    2. Ideal partner from a physiognomic compatibility perspective
    3. must be in Korean
    4. 'content' column explains overall impression based on facial features(physiognomy)
    5. 'facial_feature_preferences' column contains physiognomic features STRICTLY following the definitions and categories same format as input face features.
        Tasks:

    ### Task 6. Partner sex determination
    - Based on my sex, determine the partner’s sex.
    - Output as a single value.

    ### Task 7. Age harmony decision
    - Based on my facial features and overall impression,
      determine whether I am more visually and emotionally compatible with:
      - an older partner
      - a younger partner
      - or a similar-age partner
    - Explain the reasoning briefly, focusing on facial balance and impression.
    - Then estimate an appropriate age range (±3–7 years).

    ### Task 8. Ideal partner facial features
    - Derive the partner’s facial features that would harmonize well with mine.
    - Use the SAME feature format as the input.
    - Describe features in a complementary way (not identical).
    - Focus on balance (soft vs. defined, calm vs. expressive, etc.).

    ----

    Return ONLY valid JSON:

    {{
      "sex": "...",
      "age": "...",
      "summary": "...",
      "content": "...",
      "ideal_partner_physiognomy": {{
        "partner_summary": "...",
        "partner_age": ...,
        "partner_sex": "...",
        "facial_feature_preferences": {{
          "eyes": "...",
          "nose": "...",
          "mouth": "...",
          "face_shape": "..."
        }},
        "personality_match": "..."
      }}
    }}
    """

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=INTERPRET_PROMPT_TEMPLATE,
        temperature=0.6
    )

    return parse_llm_json(response.output_text)

    



def build_image_prompt(user_data):
    
    # ─────────────────────────────────
    # Gender-specific appearance blocks
    # ─────────────────────────────────

    MALE_APPEARANCE_BLOCK = """
    MALE APPEARANCE DETAILS:
    - Soft masculine facial features
    - Clean jawline but not sharp
    - Natural eyebrows, warm eyes
    - Hairstyle: short-to-medium or medium length, softly textured, pomade hair, fancy hair styled, natural part
    - Outfit: knit top, shirt, or light jacket
    - Accessories: none or very minimal or glasses 
    - Overall vibe: gentle, reliable, emotionally mature
    """

    FEMALE_APPEARANCE_BLOCK = """
    FEMALE APPEARANCE DETAILS:
    - Soft feminine or youth or mature or fancy facial features
    - Balanced proportions, warm expression
    - Hairstyle: medium to long hair, short hair, pony tail hair, soft waves, natural part
    - Outfit: blouse, knit top, soft cardigan
    - Accessories: small earrings or delicate necklace
    - Overall vibe: warm, calm, emotionally stable
    """

    # ─────────────────────────────────
    # Background & photography block
    # ─────────────────────────────────

    BACKGROUND_BLOCK = """
    BACKGROUND & PHOTOGRAPHY:
    - Modern cafe or minimal studio
    - Warm natural light
    - Soft diffused daylight
    - Shallow depth of field
    - Head-and-shoulders framing

    IMAGE REQUIREMENTS:
    - Photorealistic portrait
    - Natural skin texture (no over-smoothing)
    - Minimal grooming
    - High realism
    """

    partner_age = user_data["ideal_partner_physiognomy"]['partner_age']
    prefs = user_data["ideal_partner_physiognomy"]["facial_feature_preferences"]
    user_sex = user_data["sex"].lower()

    # ─────────────────────────────────
    # 1. Determine ideal partner gender
    # ─────────────────────────────────
    if user_sex == "female":
        partner_gender = "male"
        pronouns = "he / his"
        appearance_block = MALE_APPEARANCE_BLOCK
    elif user_sex == "male":
        partner_gender = "female"
        pronouns = "she / her"
        appearance_block = FEMALE_APPEARANCE_BLOCK
    else:
        raise ValueError("User sex must be either 'male' or 'female'")

    # ─────────────────────────────────
    # 2. Base prompt (gender-safe)
    # ─────────────────────────────────
    base_prompt = f"""
      You are a portrait photographer specializing in ideal partner portraits.

      TASK:
      Generate a realistic photorealistic portrait of an IDEAL PARTNER.

      IMPORTANT RULE (DO NOT IGNORE):
      - The generated person must be {partner_gender.upper()}.
      - Use "{pronouns}" consistently.
      - Do NOT mix gender traits.
      - The generated person must NOT match the user's own gender.

      ────────────────────────────────
      USER INPUT (AUTHORITATIVE SOURCE)
      ────────────────────────────────
      - User sex: {user_data['sex']}
      - User age: {user_data['age']}

      Ideal partner facial features:
      - Eyes: {prefs['eyes']}
      - Nose: {prefs['nose']}
      - Lips: {prefs['mouth']}
      - Face shape: {prefs['face_shape']}

      The above user input OVERRIDES any ambiguous wording elsewhere.
      Do NOT reinterpret or infer gender beyond this rule.

      IDEAL PARTNER CONCEPT (APPLIES TO BOTH GENDERS):
      - Apparent age: {partner_age}
      - Looks younger than chronological age
      - Youthful, slightly boyish/girlish softness
      - Warm, trustworthy, emotionally stable, approachable
      - Gentle and harmonious facial balance (not sharp or aggressive)
      - Calm, refined, modern East Asian aesthetic
      """

    # ─────────────────────────────────
    # 3. Final prompt composition
    # ─────────────────────────────────
    final_prompt = base_prompt + appearance_block + BACKGROUND_BLOCK

    return final_prompt.strip()



def save_base64_image(image_base64: str, output_path: str):
    image_bytes = base64.b64decode(image_base64)
    with open(output_path, "wb") as f:
        f.write(image_bytes)
        
def generate_ideal_partner_image(user_data: dict, output_path="ideal_partner.png"):
    prompt = build_image_prompt(user_data)
    print("\n=== USED PROMPT ===\n")
    print(prompt)
    
    result = client.images.generate(
        # model="gpt-image-1",
        model="gpt-image-1-mini",
        prompt=prompt,
        size="auto"
    )

    image_base64 = result.data[0].b64_json
    image_bytes = base64.b64decode(image_base64)

    with open(output_path, "wb") as f:
        f.write(image_bytes)

    print(f"✔ Ideal partner image saved to {output_path}")


# =========================
# 3. Main Pipeline
# =========================
def run_pipeline(image_path: str):
    gender = "female"
    age = 25

    print("▶ Extracting facial features...")
    features = extract_face_features(image_path)
    feature_file = save_json(features, "face_features")
    print(f"  ✔ Features saved to {feature_file}")

    print("▶ Interpreting physiognomy...")

    features['sex'] = gender
    features['age'] = age

    interpretation = interpret_physiognomy(features)
    # interpretation['sex'] = gender
    # interpretation['age'] = age
    interpretation_file = save_json(interpretation, "physiognomy_interpretation")
    print(f"  ✔ Interpretation saved to {interpretation_file}")

    generate_ideal_partner_image(interpretation) # image generator agent authorification 필요
    # prompt = build_image_prompt(interpretation) # todo comment!
    # print("\n=== USED PROMPT ===\n")
    # print(prompt)


    return {
        "features": features,
        "interpretation": interpretation
    }



# =========================
# Entry Point
# =========================
if __name__ == "__main__":
    # IMAGE_PATH = "han.jpg"  # 얼굴 이미지 경로
    # IMAGE_PATH = "downward.png"  # 얼굴 이미지 경로
    # IMAGE_PATH = "thick.png"  # 얼굴 이미지 경로
    # IMAGE_PATH = "thick_partner.png"  # 얼굴 이미지 경로
    # IMAGE_PATH = "girl.jpg"  # 얼굴 이미지 경로
    # IMAGE_PATH = "downward_idealpartner.png"
    # IMAGE_PATH = "thin.png"  # 얼굴 이미지 경로
    # IMAGE_PATH = "dean.jpg"  # 얼굴 이미지 경로
    # IMAGE_PATH = "dean2_long.jpg"  # 얼굴 이미지 경로
    # IMAGE_PATH = "lim.jpg"  # 얼굴 이미지 경로
    # IMAGE_PATH = "moon.jpg"  # 얼굴 이미지 경로
    # IMAGE_PATH = "moon2.jpg"  # 얼굴 이미지 경로
    IMAGE_PATH = "noa.png"  # 얼굴 이미지 경로
    # IMAGE_PATH = "shim.jpg"  # 얼굴 이미지 경로
    result = run_pipeline(IMAGE_PATH)

    print("\n=== ONE-LINE SUMMARY ===")
    print(result['interpretation'])

