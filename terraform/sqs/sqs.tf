resource "aws_sqs_queue" "vehicle_queue" {
  name = "VehicleQueue"
}

resource "aws_sqs_queue" "dead_letter_queue" {
  name = "example-dead-letter-queue"
}

resource "aws_lambda_event_source_mapping" "vehicle_lambda_sqs_mapping" {
  event_source_arn = aws_sqs_queue.vehicle_queue.arn
  function_name    = aws_lambda_function.vehicle_lambda.arn
}

resource "aws_iam_role_policy" "lambda_sqs_permissions" {
  name = "lambda_sqs_permissions"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.vehicle_queue.arn
      }
    ]
  })
}

output "sqs_queue_url" {
  value = aws_sqs_queue.vehicle_queue.url
}

output "dead_letter_queue_url" {
  value = aws_sqs_queue.dead_letter_queue.url
}
