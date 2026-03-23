"""
app/api/v1/github.py — GitHub OAuth & Repository Management
Allows users to login with GitHub OAuth and browse their repositories.
"""

import logging
import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class GitHubRepo(BaseModel):
    id: int
    name: str
    full_name: str
    html_url: str
    description: Optional[str]
    language: Optional[str]
    stargazers_count: int
    updated_at: str


class GitHubOAuthRequest(BaseModel):
    code: str


@router.get("/oauth/login")
async def github_oauth_login():
    """
    Generate GitHub OAuth authorization URL.
    Frontend redirects user to this URL to begin OAuth flow.
    """
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(500, "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID in .env")
    
    auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope=repo,user"
    )
    
    return {"auth_url": auth_url}


@router.post("/oauth/callback")
async def github_oauth_callback(body: GitHubOAuthRequest):
    """
    Exchange GitHub OAuth code for access token.
    Called by frontend after user authorizes on GitHub.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                json={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": body.code,
                    "redirect_uri": settings.GITHUB_REDIRECT_URI,
                },
                headers={"Accept": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
            if "access_token" not in data:
                raise HTTPException(400, f"OAuth error: {data.get('error_description', 'Unknown error')}")
            
            access_token = data["access_token"]
            
            # Get user info
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            user_response.raise_for_status()
            user_data = user_response.json()
            
            return {
                "access_token": access_token,
                "user": {
                    "login": user_data["login"],
                    "name": user_data.get("name"),
                    "avatar_url": user_data.get("avatar_url"),
                    "public_repos": user_data.get("public_repos", 0),
                }
            }
    except httpx.HTTPStatusError as e:
        logger.error(f"GitHub OAuth failed: {e}")
        raise HTTPException(500, f"GitHub OAuth failed: {str(e)}")
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        raise HTTPException(500, str(e))


@router.get("/repos")
async def get_user_repos(access_token: str):
    """
    Fetch all repositories for authenticated GitHub user.
    
    Query params:
        access_token: GitHub personal access token or OAuth token
    """
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user/repos",
                headers=headers,
                params={
                    "per_page": 100,
                    "sort": "updated",
                    "affiliation": "owner,collaborator"
                }
            )
            response.raise_for_status()
            repos = response.json()
            
            return {
                "repos": [
                    {
                        "id": repo["id"],
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "html_url": repo["html_url"],
                        "description": repo.get("description"),
                        "language": repo.get("language"),
                        "stargazers_count": repo.get("stargazers_count", 0),
                        "updated_at": repo["updated_at"],
                    }
                    for repo in repos
                ],
                "total": len(repos)
            }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise HTTPException(401, "Invalid or expired GitHub token")
        raise HTTPException(500, f"GitHub API error: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to fetch GitHub repos: {e}")
        raise HTTPException(500, f"Failed to fetch repositories: {str(e)}")


@router.get("/user")
async def get_github_user(access_token: str):
    """Get authenticated GitHub user info."""
    try:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user",
                headers=headers
            )
            response.raise_for_status()
            user = response.json()
            
            return {
                "login": user["login"],
                "name": user.get("name"),
                "avatar_url": user.get("avatar_url"),
                "public_repos": user.get("public_repos", 0),
                "followers": user.get("followers", 0),
            }
    except Exception as e:
        logger.error(f"Failed to fetch GitHub user: {e}")
        raise HTTPException(500, str(e))
