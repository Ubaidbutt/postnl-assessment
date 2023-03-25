resource "aws_dynamodb_table" "handheld_device_location" {
  name           = "HandheldDeviceLocation"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "handheldId"

  attribute {
    name = "handheldId"
    type = "S"
  }

  ttl {
    attribute_name = "timestamp"
    enabled        = false
  }
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.handheld_device_location.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.handheld_device_location.arn
}
