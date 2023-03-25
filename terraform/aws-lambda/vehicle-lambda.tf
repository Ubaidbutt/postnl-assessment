resource "aws_iam_role" "vehicle_lambda_role" {
  name = "vehicle_lambda_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "vehicle_lambda_dynamodb_policy" {
  name = "vehicle_lambda_dynamodb_policy"
  role = aws_iam_role.vehicle_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
    Resource = [
          aws_dynamodb_table.handheld_device_location.arn,
          // Give access to the dynamodb lookup table
        ]
      }
    ]
  })
}

resource "aws_lambda_function" "vehicle_lambda" {
  function_name = "VehicleLambda"
  handler       = "functions/VehicleLambda/handler.calculateDistanceAndSendAlerts"
  role          = aws_iam_role.lambda_role.arn
  runtime       = "nodejs14.x"

  filename = "dist.zip"

  environment {
    variables = {
      HANDHELD_DEVICE_TABLE_NAME = aws_dynamodb_table.handheld_device_location.name
    }
  }
}

output "vehicle_lambda_arn" {
  value = aws_lambda_function.vehicle_lambda.arn
}
