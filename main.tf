
resource "genesyscloud_integration" "Function_Data_Actions" {
    integration_type = "function-data-actions"
    intended_state = "ENABLED"

    config {
      name = "Function_Data_Actions_Nikko"
      credentials = genesyscloud_integration_credential.function_credentials.id
    }
}

resource "genesyscloud_integration_credential" "function_credentials" {
  name = "Function_Data_Actions_Nikko_Credentials"
  credential_type_name = "userDefined"

  fields = {
    clientId = var.client_id
    clientSecret = var.client_secret
  }
}

resource "genesyscloud_integration_action" "Sample_Function" {
  name = "Sample_Function"
  category = genesyscloud_integration.Function_Data_Actions.config.0.name
  integration_id = genesyscloud_integration.Function_Data_Actions.id
  secure = false
  
  contract_input = jsonencode({
    "type" = "object",
    "properties" = {
      "mode" = {
        "type" = "string",
        "description" = "Operation mode: 'encrypt' or 'decrypt'",
        "enum" = ["encrypt", "decrypt"]
      },
      "text" = {
        "type" = "string",
        "description" = "The text to encrypt or the ciphertext to decrypt"
      },
      "passphrase" = {
        "type" = "string",
        "description" = "The passphrase used as the encryption key"
      }
    },
    "additionalProperties" = false
  })

  contract_output = jsonencode({
    "type" = "object",
    "properties" = {
      "result" = {
        "type" = "string",
        "description" = "The encrypted ciphertext or decrypted plaintext"
      }
    },
    "additionalProperties" = false
  })

  config_request {
    request_type     = "POST"
    request_template = "$${input.rawRequest}"
    request_url_template = ""
  }

  function_config {
    description = "Encrypts or decrypts text using AES-256-GCM"
    handler = "index.handler"
    runtime = "nodejs22.x"
    file_path = "${path.module}/resources/sample_function.zip"
  }
  

}