<?php
// Set headers to prevent CORS issues
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Initialize response array
$response = [
    "status" => "error",
    "message" => "An error occurred"
];

// Check if form was submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form data
    $name = isset($_POST['name']) ? strip_tags(trim($_POST['name'])) : '';
    $phone = isset($_POST['phone']) ? strip_tags(trim($_POST['phone'])) : '';
    $message = isset($_POST['message']) ? strip_tags(trim($_POST['message'])) : '';
    
    // Validate form data
    if (empty($name) || empty($phone) || empty($message)) {
        $response["message"] = "All fields are required";
    } else {
        // Admin email address
        $to = "sales@megatronixx.co.za";
        
        // Email subject
        $subject = "New Contact Form Submission from Megatronixx Website";
        
        // Prepare email content
        $email_content = "Name: $name\n";
        $email_content .= "Phone: $phone\n\n";
        $email_content .= "Message:\n$message\n";
        
        // Email headers
        $headers = "From: no-reply@megatronixx.co.za\r\n";
        $headers .= "Reply-To: $name <$phone>\r\n";
        
        // Send email
        if (mail($to, $subject, $email_content, $headers)) {
            $response["status"] = "success";
            $response["message"] = "Thank you! Your message has been sent.";
        } else {
            $response["message"] = "Oops! Something went wrong, we couldn't send your message.";
        }
    }
}

// Return JSON response
echo json_encode($response);
?>
