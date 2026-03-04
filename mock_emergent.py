from typing import List, Optional, Any

class UserMessage:
    def __init__(self, content: str, role: str = "user"):
        self.content = content
        self.role = role

class LlmChat:
    def __init__(self, *args, **kwargs):
        pass

    def chat(self, messages: List[UserMessage], **kwargs) -> Any:
        return type("Response", (), {"content": "Mock response"})()
