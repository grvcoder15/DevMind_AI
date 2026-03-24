"""
app/services/ai_service.py — Unified LLM abstraction layer.
Supports Anthropic Claude and OpenAI; switch via LLM_PROVIDER config.
Also contains service functions: hinglish, learning, flow, prototype.
"""

import json
import logging
from typing import List, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)


# ─── LLM Client ──────────────────────────────────────────────────────────────

class LLMClient:
    """
    Unified interface for multiple LLM providers.
    Supports FREE options: Ollama (local), HuggingFace, OpenRouter.
    All calls are async and return plain text.
    """

    async def complete(
        self,
        messages:    List[dict],
        system:      str = "",
        temperature: Optional[float] = None,
        max_tokens:  Optional[int]   = None,
    ) -> str:
        temp   = temperature if temperature is not None else settings.TEMPERATURE
        tokens = max_tokens or settings.MAX_TOKENS

        provider = settings.LLM_PROVIDER.lower()
        
        if provider == "gemini":
            return await self._gemini(messages, system, temp, tokens)
        elif provider == "ollama":
            return await self._ollama(messages, system, temp, tokens)
        elif provider == "huggingface":
            return await self._huggingface(messages, system, temp, tokens)
        elif provider == "openrouter":
            return await self._openrouter(messages, system, temp, tokens)
        elif provider == "anthropic":
            return await self._anthropic(messages, system, temp, tokens)
        elif provider == "openai":
            return await self._openai(messages, system, temp, tokens)
        else:
            logger.warning(f"Unknown provider '{provider}', falling back to Gemini")
            return await self._gemini(messages, system, temp, tokens)

    # ── FREE PROVIDERS ───────────────────────────────────────────────────────

    async def _ollama(self, messages, system, temperature, max_tokens) -> str:
        """
        Ollama - Local LLM (FREE)
        Install: curl https://ollama.ai/install.sh | sh
        Pull model: ollama pull llama3
        """
        try:
            import httpx
            
            # Build prompt from system + messages
            conversation = ""
            if system:
                conversation += f"System: {system}\n\n"
            
            for msg in messages:
                role = msg.get("role", "user").capitalize()
                content = msg.get("content", "")
                conversation += f"{role}: {content}\n\n"
            
            conversation += "Assistant:"
            
            # Increased timeout for long AI responses (5 minutes)
            # First request loads model which takes longer
            async with httpx.AsyncClient(timeout=300.0) as client:
                logger.info(f"Sending request to Ollama ({settings.OLLAMA_MODEL})...")
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": conversation,
                        "temperature": temperature,
                        "stream": False,
                        "options": {"num_predict": max_tokens}
                    }
                )
                response.raise_for_status()
                result = response.json()["response"].strip()
                logger.info(f"Ollama response received ({len(result)} chars)")
                return result
        except httpx.ReadTimeout:
            logger.error(f"Ollama timeout - model may be loading or prompt too long")
            raise RuntimeError("Ollama timeout. Try again - model may be loading for first time.")
        except httpx.ConnectError as e:
            logger.error(f"Cannot connect to Ollama: {e}")
            raise RuntimeError("Cannot connect to Ollama. Is it running? (ollama serve)")
        except Exception as e:
            logger.error(f"Ollama request failed: {e}")
            raise RuntimeError(f"Ollama error: {e}")

    async def _gemini(self, messages, system, temperature, max_tokens) -> str:
        """
        Google Gemini - FREE with generous limits + AUTO-FALLBACK
        Get API key: https://makersuite.google.com/app/apikey
        Free tier: 15 RPM, 1M tokens/day
        
        Smart fallback: Automatically tries different models on rate limits
        """
        import httpx
        
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not set in environment")
        
        # Build prompt from system + messages
        prompt = ""
        if system:
            prompt += f"{system}\n\n"
        
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                prompt += f"{content}\n\n"
            elif role == "assistant":
                prompt += f"Response: {content}\n\n"
        
        # Try all fallback models until one works
        models_to_try = settings.GEMINI_FALLBACK_MODELS
        last_error = None
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            for idx, model in enumerate(models_to_try):
                try:
                    # Remove 'models/' prefix if present
                    model_name = model.replace("models/", "")
                    
                    # Small delay between retries (except first attempt)
                    if idx > 0:
                        import asyncio
                        await asyncio.sleep(1)  # 1 second delay between models
                    
                    logger.info(f"[{idx+1}/{len(models_to_try)}] Trying Gemini: {model_name}...")
                    
                    response = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}",
                        json={
                            "contents": [{
                                "parts": [{"text": prompt}]
                            }],
                            "generationConfig": {
                                "temperature": temperature,
                                "maxOutputTokens": max_tokens,
                            }
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    if "candidates" in data and len(data["candidates"]) > 0:
                        result = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                        logger.info(f"✅ SUCCESS with {model_name} ({len(result)} chars)")
                        return result
                    else:
                        logger.warning(f"No candidates in response from {model_name}")
                        continue
                        
                except httpx.HTTPStatusError as e:
                    status_code = e.response.status_code
                    error_body = e.response.text
                    
                    # Check for quota/rate limit errors (429, 403, or 500 with quota message)
                    is_quota_error = (
                        status_code == 429 or 
                        status_code == 403 or
                        (status_code >= 500 and ('quota' in error_body.lower() or 'limit' in error_body.lower()))
                    )
                    
                    if is_quota_error:
                        logger.warning(f"⚠️ Quota/Rate limit on {model_name} (HTTP {status_code}), trying next...")
                    elif status_code == 404:
                        logger.warning(f"⚠️ Model {model_name} not available, trying next...")
                    else:
                        logger.warning(f"⚠️ HTTP {status_code} on {model_name}: {error_body[:100]}, trying next...")
                    last_error = e
                    continue
                    
                except Exception as e:
                    logger.warning(f"⚠️ Error with {model_name}: {str(e)[:100]}, trying next...")
                    last_error = e
                    continue
            
            # If all models failed, raise the last error
            if last_error:
                raise RuntimeError(f"All Gemini models failed. Last error: {str(last_error)}")
            else:
                raise RuntimeError("No response from any Gemini model")

    async def _huggingface(self, messages, system, temperature, max_tokens) -> str:
        """
        HuggingFace Inference API (FREE tier available)
        Get key: https://huggingface.co/settings/tokens
        """
        try:
            import httpx
            
            prompt = ""
            if system:
                prompt += f"[INST] {system} [/INST]\n\n"
            
            for msg in messages:
                if msg["role"] == "user":
                    prompt += f"[INST] {msg['content']} [/INST]\n"
                else:
                    prompt += f"{msg['content']}\n"
            
            headers = {"Authorization": f"Bearer {settings.HUGGINGFACE_API_KEY}"}
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"https://api-inference.huggingface.co/models/{settings.HUGGINGFACE_MODEL}",
                    headers=headers,
                    json={
                        "inputs": prompt,
                        "parameters": {
                            "temperature": temperature,
                            "max_new_tokens": max_tokens,
                            "return_full_text": False
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get("generated_text", "").strip()
                return str(result).strip()
        except Exception as e:
            logger.error(f"HuggingFace request failed: {e}")
            raise RuntimeError(f"HuggingFace error: {e}")

    async def _openrouter(self, messages, system, temperature, max_tokens) -> str:
        """
        OpenRouter - Access to FREE models
        Get key: https://openrouter.ai/keys
        FREE models: meta-llama/llama-3-8b-instruct:free
        """
        try:
            import httpx
            
            all_msgs = []
            if system:
                all_msgs.append({"role": "system", "content": system})
            all_msgs.extend(messages)
            
            headers = {
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://devmind.ai",
                "X-Title": "DevMind AI"
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json={
                        "model": settings.OPENROUTER_MODEL,
                        "messages": all_msgs,
                        "temperature": temperature,
                        "max_tokens": max_tokens
                    }
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.error(f"OpenRouter request failed: {e}")
            raise RuntimeError(f"OpenRouter error: {e}")

    # ── PAID PROVIDERS (OPTIONAL) ────────────────────────────────────────────

    async def _anthropic(self, messages, system, temperature, max_tokens) -> str:
        """Anthropic Claude (PAID)"""
        try:
            from anthropic import AsyncAnthropic
            client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            resp = await client.messages.create(
                model=settings.LLM_MODEL,
                max_tokens=max_tokens,
                temperature=temperature,
                system=system,
                messages=messages,
            )
            return resp.content[0].text.strip()
        except ImportError:
            raise RuntimeError("Install anthropic: pip install anthropic")

    async def _openai(self, messages, system, temperature, max_tokens) -> str:
        """OpenAI GPT (PAID)"""
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            all_msgs = ([{"role": "system", "content": system}] if system else []) + messages
            resp = await client.chat.completions.create(
                model="gpt-4o",
                temperature=temperature,
                max_tokens=max_tokens,
                messages=all_msgs,
            )
            return resp.choices[0].message.content.strip()
        except ImportError:
            raise RuntimeError("Install openai: pip install openai")


# Global singleton
llm = LLMClient()


# ─── Hinglish ────────────────────────────────────────────────────────────────

_HINGLISH_PROMPTS = {
    "casual": (
        "Convert the following English technical explanation to casual Hinglish (Hindi + English mix).\n"
        "Rules: use common Hindi words (yahan, matlab, basically, dekho, hota hai, aur, phir);\n"
        "keep ALL code identifiers, file names, and function names in English;\n"
        "sound like a senior Indian developer explaining casually; max 150 words; return ONLY the Hinglish text.\n\n"
        "Text: {text}"
    ),
    "formal": (
        "Convert to formal Hindi-English (Hinglish) for technical documentation.\n"
        "Use professional Hindi words; keep all technical terms in English.\n"
        "Sound like a technical trainer. Max 200 words. Return only the translation.\n\n"
        "Text: {text}"
    ),
    "developer": (
        "Convert to ultra-casual Indian developer Hinglish.\n"
        "Use slang: bhai, dekh, simple hai, kuch nahi, ekdam sahi, chal jata hai.\n"
        "Keep all code in English. Max 120 words. Return only the translation.\n\n"
        "Text: {text}"
    ),
}


async def convert_to_hinglish(text: str, style: str = "casual") -> str:
    """Convert English technical text to Hinglish."""
    prompt = _HINGLISH_PROMPTS.get(style, _HINGLISH_PROMPTS["casual"]).format(text=text)
    try:
        return await llm.complete(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2048,  # Increased from 400 to 2048 for longer responses
        )
    except Exception as e:
        logger.warning(f"Hinglish conversion failed: {e}")
        return text


# ─── Guided Learning ─────────────────────────────────────────────────────────

_LEARNING_SYSTEM = (
    "You are a senior software architect creating a guided learning curriculum.\n"
    "Generate structured, progressive steps for a developer who wants to understand a codebase deeply.\n"
    "Always return valid JSON only — no markdown fences, no preamble."
)

_LEARNING_PROMPT = """\
Create a guided learning plan for this codebase.

Project: {project_name}
Framework: {framework} ({language})
Summary: {summary}
Architecture: {architecture}
Entry Points: {entry_points}
File Ranking (most important first):
{file_ranking}

Return JSON with this exact structure:
{{
  "prerequisite_knowledge": ["concept1", "concept2"],
  "estimated_total_time": "X hours",
  "steps": [
    {{
      "step": 1,
      "title": "Step title",
      "description": "What the learner will understand after this step",
      "files_to_read": ["file1.py", "file2.py"],
      "key_concepts": ["concept1", "concept2"],
      "estimated_time": "20 minutes"
    }}
  ]
}}

Generate 6-8 progressive steps from foundations to advanced features.
"""


async def generate_learning_plan(analysis: dict) -> dict:
    """Generate a step-by-step learning curriculum for a repository."""
    file_ranking_text = "\n".join(
        f"  {i+1}. {f['file']} — {f['purpose']}"
        for i, f in enumerate(analysis.get("file_ranking", [])[:10])
    )

    logger.info(f"Generating learning plan for {analysis.get('project_name')} ({analysis.get('framework')})")

    raw = await llm.complete(
        system=_LEARNING_SYSTEM,
        messages=[{"role": "user", "content": _LEARNING_PROMPT.format(
            project_name=analysis.get("project_name", "Unknown"),
            framework=analysis.get("framework", "Unknown"),
            language=analysis.get("language", "Unknown"),
            summary=analysis.get("summary", ""),
            architecture=analysis.get("architecture_overview", ""),
            entry_points=", ".join(analysis.get("entry_points", [])),
            file_ranking=file_ranking_text,
        )}],
        temperature=0.3,
        max_tokens=2000,
    )

    logger.info(f"AI raw response (first 300 chars): {raw[:300]}")

    try:
        parsed = json.loads(raw.replace("```json", "").replace("```", "").strip())
        logger.info(f"Learning steps parsed: {len(parsed.get('steps', []))}")
        return parsed
    except json.JSONDecodeError as e:
        logger.error(f"Learning plan JSON parse failed: {e}")
        logger.error(f"Raw response: {raw[:500]}")
        return {"steps": [], "prerequisite_knowledge": [], "estimated_total_time": "Unknown"}


# ─── Flow Generation ─────────────────────────────────────────────────────────

_FLOW_SYSTEM = (
    "You are an expert system architect. Generate text-based flow diagrams showing "
    "how data and requests move through a software system. "
    "Always return valid JSON only — no markdown fences."
)

_FLOW_PROMPT = """\
Analyze this codebase and generate 3-4 key system flow diagrams.

Project: {project_name}
Framework: {framework}
Architecture: {architecture}
Data Flow Description: {data_flow}
Key Files:
{key_files}

Return JSON:
{{
  "flows": [
    {{
      "name": "Flow Name",
      "description": "What this flow represents",
      "text_representation": "User Request\\n    ↓\\nRouter Layer\\n    ↓\\nResponse",
      "nodes": ["Node1", "Node2", "Node3"],
      "type": "request"
    }}
  ]
}}

Node types: entry | process | data | output | external | error
Generate flows for: main request flow, auth flow, data persistence flow, async jobs (if applicable).
"""


async def generate_flows(analysis: dict) -> dict:
    """Generate system flow diagrams from analysis data."""
    key_files = "\n".join(
        f"  - {f['file']}: {f['purpose']}"
        for f in analysis.get("file_ranking", [])[:8]
    )

    raw = await llm.complete(
        system=_FLOW_SYSTEM,
        messages=[{"role": "user", "content": _FLOW_PROMPT.format(
            project_name=analysis.get("project_name", "Unknown"),
            framework=analysis.get("framework", "Unknown"),
            architecture=analysis.get("architecture_overview", ""),
            data_flow=analysis.get("data_flow", ""),
            key_files=key_files,
        )}],
        temperature=0.2,
        max_tokens=2500,
    )

    try:
        return json.loads(raw.replace("```json", "").replace("```", "").strip())
    except json.JSONDecodeError as e:
        logger.warning(f"Flow JSON parse failed: {e}")
        return {"flows": []}


# ─── Prototype Generation ─────────────────────────────────────────────────────

_PROTO_SYSTEM = (
    "You are a frontend architect analyzing a backend codebase to infer UI screens. "
    "Generate production-quality React placeholder components. "
    "Return valid JSON only — no markdown."
)

_PROTO_PROMPT = """\
Analyze ACTUAL component code and extract COMPLETE UI structure (not generic placeholders!).

Project: {project_name}
Framework: {framework}
Entry Points: {entry_points}
Summary: {summary}

**ACTUAL COMPONENT CODE** (analyze this carefully):
{file_listing}

**CRITICAL INSTRUCTIONS - READ JSX TEXT CONTENT**:
1. **Extract ACTUAL text content from JSX tags** - NOT prop variable names!
   - ✅ `<Button>Log In</Button>` → Extract "Log In"
   - ✅ `<Typography>Total Moves</Typography>` → Extract "Total Moves"  
   - ✅ `placeholder="partner@company.com"` → Extract "partner@company.com"
   - ❌ `{{emailAddress}}` → SKIP (this is a prop variable)
   - ❌ `{{totalMoves}}` → SKIP (this is a prop variable)

2. **Extract from ALL files**:
   - **Sidebar** → All navigation items with their text
   - **Header** → Search box, notifications, buttons, profile
   - **All Pages** → Login, Dashboard, and ANY other pages
   - **Components** → Container, Container1, Container2, Container3, etc.

3. **Build COMPLETE navigation structure**:
   - Find ALL route paths from React Router
   - Find navigation links in Sidebar
   - Map each navigation item to its page

4. **Parse JSX properly**:
   - Look for text BETWEEN tags: `>TEXT HERE</`
   - Look for `placeholder=` attributes
   - Look for `label=` attributes
   - Look for string literals in quotes

**EXAMPLE** (if you see this code):
```jsx
<Button>Request Access</Button>
<input placeholder="Enter email" />
<Typography>{{redeemYourRewards}}</Typography>  ← SKIP this (prop variable)
<Typography>Redeem Your Rewards</Typography>    ← USE this (actual text)
```

Extract:
- buttons: ["Request Access"]
- inputs: ["Enter email"]
- headings: ["Redeem Your Rewards"]  ← NOT "redeemYourRewards"

Return JSON with COMPLETE app structure:
{{
  "framework_detected": "{framework}",
  "navigation_structure": "Complete navigation from Sidebar with all menu items",
  "screens": [
    {{
      "name": "Login",
      "route": "/",
      "description": "User authentication page",
      "file_path": "src/pages/Login.jsx",
      "components": ["Container1", "Container"],
      "ui_elements": {{
        "buttons": ["Log In", "Request Access"],
        "inputs": ["partner@company.com", "Password"],
        "headings": ["Welcome", "Sign In"],
        "links": ["Forgot Password?", "Create Account"]
      }},
      "icon": "🔐"
    }},
    {{
      "name": "Dashboard", 
      "route": "/dashboard",
      "description": "Main dashboard with stats",
      "file_path": "src/pages/Dashboard.jsx",
      "components": ["Header", "Sidebar", "Container2", "Container3"],
      "ui_elements": {{
        "buttons": ["Redeem Rewards", "View Reports"],
        "inputs": ["Search moves, rewards, reports..."],
        "headings": ["Dashboard", "Total Moves", "This Month"],
        "links": []
      }},
      "icon": "📊"
    }}
  ],
  "sidebar_navigation": [
    {{"name": "Dashboard", "route": "/dashboard", "icon": "📊"}},
    {{"name": "Shipments", "route": "/shipments", "icon": "📦"}},
    {{"name": "Rewards", "route": "/rewards", "icon": "🎁"}}
  ],
  "header_elements": {{
    "search": "Search placeholder text",
    "notifications": true,
    "profile": "User Name"
  }}
}}

**EXTRACT ACTUAL TEXT FROM JSX - NOT PROP VARIABLES!**
**Analyze Sidebar, Header, ALL pages, and ALL components!**
**Build complete navigation map!**
"""


async def generate_prototype(analysis: dict, file_paths: list, repo_id: str, db) -> dict:
    """Detect UI screens by reading ACTUAL component code from Supabase DB (not filesystem)."""
    
    logger.info(f"Generating prototype for {analysis.get('project_name')} ({analysis.get('framework')})")
    
    # Filter for actual UI component files (pages, components, routes)
    ui_files = [
        f for f in file_paths 
        if any(pattern in f.lower() for pattern in [
            '/pages/', '/screens/', '/views/', '/routes/',  # Page folders
            '/components/',                                  # Component folder
            'sidebar.', 'header.', 'navbar.', 'menu.',      # Layout components
            'login.', 'dashboard.', 'home.', 'profile.',    # Common page names
            '.jsx', '.tsx', '.vue', '.svelte'                # UI frameworks
        ]) and not ('node_modules' in f or 'test' in f.lower())
    ]
    
    logger.info(f"Found {len(ui_files)} potential UI component files")
    
    # Prioritize important files (Sidebar, Header, Pages first)
    priority_files = []
    layout_files = []  # Sidebar, Header, Navbar
    page_files = []    # Login, Dashboard, etc.
    other_files = []   # Container1, Container2, etc.
    
    for f in ui_files:
        lower_f = f.lower()
        if any(x in lower_f for x in ['sidebar', 'header', 'navbar', 'menu', 'nav']):
            layout_files.append(f)
        elif any(x in lower_f for x in ['/pages/', '/screens/', '/views/', 'login', 'dashboard']):
            page_files.append(f)
        else:
            other_files.append(f)
    
    # Priority: Layout files → Page files → Other components
    priority_files = layout_files + page_files + other_files
    
    logger.info(f"Layout files: {len(layout_files)}, Page files: {len(page_files)}, Other: {len(other_files)}")
    
    # Read actual component code from DATABASE (not filesystem)
    from app.services.repo_service import RepoService
    repo_service = RepoService()
    
    component_code_samples = []
    db_files = await repo_service.get_files_from_db(repo_id, db)
    
    logger.info(f"📊 Database has {len(db_files)} total files for repo {repo_id}")
    
    if not db_files:
        logger.error(f"❌ No files found in database for repo {repo_id}! Database might not be populated.")
    
    # Create lookup for fast access
    db_files_dict = {f['path']: f for f in db_files}
    
    # Log first few DB paths for debugging
    if db_files:
        sample_db_paths = list(db_files_dict.keys())[:5]
        logger.info(f"Sample DB file paths: {sample_db_paths}")
    
    # Log priority files we're looking for
    logger.info(f"Looking for UI files: {priority_files[:5]}")
    
    # Filter for UI files and get their content from DB (analyze up to 15 files)
    matched_files = []
    for file_path in priority_files[:15]:  # Increased from 8 to 15
        if file_path in db_files_dict:
            db_file = db_files_dict[file_path]
            content = db_file['content'][:3500]  # Increased from 2000 to 3500 chars
            component_code_samples.append(f"File: {file_path}\n{content}")
            matched_files.append(file_path)
    
    logger.info(f"✅ Matched {len(matched_files)} files from DB: {matched_files[:3]}")
    
    if not component_code_samples:
        logger.warning(f"⚠️ No component code could be read from DB!")
        logger.warning(f"Priority files wanted: {priority_files[:10]}")
        logger.warning(f"DB has these paths: {list(db_files_dict.keys())[:10]}")
        logger.warning("Falling back to file list only (less accurate)")
        file_listing = "\n".join(f"  {p}" for p in ui_files[:30])
        component_analysis = file_listing
    else:
        component_analysis = "\n\n---\n\n".join(component_code_samples)
    
    logger.info(f"🔍 Analyzing {len(component_code_samples)} component files with actual code from DB")

    raw = await llm.complete(
        system=_PROTO_SYSTEM,
        messages=[{"role": "user", "content": _PROTO_PROMPT.format(
            project_name=analysis.get('project_name', "Unknown"),
            framework=analysis.get('framework', "Unknown"),
            entry_points=", ".join(analysis.get("entry_points", [])),
            summary=analysis.get("summary", ""),
            file_listing=component_analysis,
        )}],
        temperature=0.4,
        max_tokens=8000,  # Increased to allow complete navigation + all screens + sidebar + header
    )

    logger.info(f"AI raw response length: {len(raw)} chars (first 500): {raw[:500]}")

    try:
        # Clean up response - remove markdown, extra whitespace
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)
        
        screens_count = len(parsed.get('screens', []))
        logger.info(f"🎨 Prototype screens detected: {screens_count}")
        
        if screens_count == 0:
            logger.warning(f"⚠️ LLM returned 0 screens!")
            logger.warning(f"Input had {len(component_code_samples)} code samples, {len(ui_files)} UI files")
            logger.warning(f"Framework: {analysis.get('framework')}, Entry points: {analysis.get('entry_points')}")
        
        # Log UI elements for debugging
        for screen in parsed.get('screens', []):
            elements = screen.get('ui_elements', {})
            logger.info(f"  - {screen.get('name')}: {len(elements.get('buttons', []))} buttons, "
                       f"{len(elements.get('inputs', []))} inputs, "
                       f"{len(elements.get('headings', []))} headings")
        
        return parsed
    except json.JSONDecodeError as e:
        logger.error(f"❌ Prototype JSON parse failed: {e}")
        logger.error(f"Raw response ({len(raw)} chars): {raw[:500]}...")
        logger.error(f"This usually means max_tokens was too low or response was truncated")
        
        # Return informative error instead of empty
        return {
            "screens": [{
                "name": "Error: Parsing Failed",
                "description": "LLM response could not be parsed. Check logs for details.",
                "ui_elements": {"buttons": [], "inputs": [], "headings": []},
                "route": "/error"
            }],
            "framework_detected": "React",
            "navigation_structure": "Error occurred during parsing"
        }
