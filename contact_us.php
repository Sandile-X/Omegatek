<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $phone = htmlspecialchars($_POST['phone']);
    $message = htmlspecialchars($_POST['message']);

    // Set your email details
    $to = "your_email@example.com";
    $subject = "New Contact Form Submission";
    $headers = "From: $email";

    // Email body
    $emailBody = "Name: $name\n";
    $emailBody .= "Email: $email\n";
    $emailBody .= "Phone: $phone\n";
    $emailBody .= "Message:\n$message\n";

    // Send the email
    if (mail($to, $subject, $emailBody, $headers)) {
        // Redirect to thank-you page
        header("Location: thank_you.html");
        exit();
    } else {
        echo "Failed to send message. Please try again.";
    }
} else {
    echo "Invalid request.";
}
?>
