from src.security.system_security import SystemSecurity

token = SystemSecurity.create_system_token(
    system_id=1,
    business_id=1,
    system_name="n8n-dev-kaiky"
)

print(token)