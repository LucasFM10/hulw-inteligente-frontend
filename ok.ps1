# Força o PowerShell a usar o protocolo de segurança correto (evita erros de SSL)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$token = "EAAU7FhGha6MBRTlWiZBQ0LSV6siVlRpIl96OiZBl5J3z7PmCknz5uagNgcko9UgP5S0sjZCrfZBQYyWTCtEK1PF2PZAEpZBMp0bkZBE0L7ZCKGBWtcA8GnZBrazdZBnMZCz0wKZAXqsZCHXX4ghPaBAzaUv4tLLqRMakZCqXRRMNneX3SghwlfyhvPMPTTUSD1O7lXfrkIe8ZAQiezhZCNmCY4jaB3JucsaL3mkdqbgH4QZBPAy6VHEgwiP5tLMdaymEBQENFAW3WpeBQRmdQZCXos850VxNPUjAZDZD"
$url = "https://graph.facebook.com/v25.0/1107457469115961/messages"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# Monta o JSON de forma nativa e segura no PowerShell (note que já está sem o 9 no DDD)
$body = @{
    messaging_product = "whatsapp"
    to = "558396774337"
    type = "template"
    template = @{
        name = "hello_world"
        language = @{
            code = "en_US"
        }
    }
} | ConvertTo-Json -Depth 10

# Dispara a requisição e exibe o resultado
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
    Write-Host "SUCESSO! O WhatsApp retornou:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "ERRO NA REQUISIÇÃO:" -ForegroundColor Red
    $_.ErrorDetails.Message
}