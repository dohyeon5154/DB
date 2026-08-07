import os
from google import genai
from supabase import create_client, Client

# 1. API 키 및 클라이언트 설정
GEMINI_API_KEY = ""
SUPABASE_URL = ""
SUPABASE_KEY = ""  # 시크릿키

# 클라이언트 생성
ai = genai.Client(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def search_similar_chunks(user_question: str, match_count: int = 3):
    try:
        print(f"🔍 질문 입력: '{user_question}'")
        
        # Step 1: 임베딩 생성 (gemini-embedding-2)
        response = ai.models.embed_content(
            model="gemini-embedding-2",
            contents=user_question,
            config={"output_dimensionality": 3072}
        )
        
        query_vector = response.embeddings[0].values
        print(f"✅ 질문 임베딩 완료 (차원 수: {len(query_vector)})")

        # Step 2: Supabase RPC 호출
        rpc_params = {
            "query_embedding": query_vector,
            "match_count": match_count
        }
        
        db_response = supabase.rpc("match_chunks", rpc_params).execute()
        
        # 💡 [핵심 디버깅] DB에서 응답받은 원본 객체 전체 출력
        print(f"\n📡 DB 응답 원본: {db_response}")

        results = db_response.data

        # Step 3: 결과 출력
        if results and len(results) > 0:
            print("\n🎯 가장 비슷한 문서 Top 3:")
            for idx, item in enumerate(results, 1):
                similarity_percent = round(item["similarity"] * 100, 1)
                print(f"\n[{idx}등] 유사도: {similarity_percent}% (ID: {item['id']})")
                print(f"내용: {item['content']}")
        else:
            print("\n⚠️ results가 비어있습니다 (Empty List).")

        return results

    except Exception as e:
        print(f"❌ 에러 발생: {e}")

if __name__ == "__main__":
    search_similar_chunks("연차 유급 휴가는 며칠이나 나오나요?")