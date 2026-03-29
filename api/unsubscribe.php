<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Unsubscribe | Omegatek Solutions</title>
    <link rel="icon" type="image/png" href="images2/OMEGATEK%20ICON%20ONLY.png">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 5rem 4rem;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            text-align: center;
        }
        
        h1 {
            font-size: 3.5rem;
            color: #334;
            margin-bottom: 2rem;
        }
        
        p {
            font-size: 1.8rem;
            color: #666;
            margin-bottom: 2rem;
            line-height: 1.6;
        }
        
        .icon {
            font-size: 8rem;
            margin-bottom: 2rem;
        }
        
        .btn {
            padding: 1.5rem 3rem;
            border: none;
            border-radius: 8px;
            font-size: 1.6rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #b30ce6, #9333ea);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(179, 12, 230, 0.4);
        }
        
        .btn-secondary {
            background: white;
            color: #334;
            border: 2px solid #334;
            margin-left: 1rem;
        }
        
        .loading {
            display: none;
            font-size: 1.6rem;
            color: #666;
        }
        
        .loading.active {
            display: block;
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    
    <div class="container">
        <!-- Loading State -->
        <div class="loading active" id="loading">
            <div class="icon">⏳</div>
            <h1>Processing...</h1>
            <p>Please wait while we process your request.</p>
        </div>
        
        <!-- Confirm State -->
        <div class="hidden" id="confirmScreen">
            <div class="icon">😢</div>
            <h1>We're Sorry to See You Go</h1>
            <p>Are you sure you want to unsubscribe from Omegatek Solutions newsletter?</p>
            <p style="font-size: 1.5rem; color: #999;">
                You'll no longer receive updates about our services, tech tips, and special offers.
            </p>
            <div style="margin-top: 3rem;">
                <button class="btn btn-primary" onclick="confirmUnsubscribe()">
                    Yes, Unsubscribe
                </button>
                <a href="index.html" class="btn btn-secondary">
                    No, Keep Me Subscribed
                </a>
            </div>
        </div>
        
        <!-- Success State -->
        <div class="hidden" id="successScreen">
            <div class="icon">✅</div>
            <h1>You've Been Unsubscribed</h1>
            <p>You won't receive any more emails from us.</p>
            <p style="font-size: 1.5rem; color: #999;">
                If you change your mind, you can always subscribe again from our website.
            </p>
            <div style="margin-top: 3rem;">
                <a href="index.html" class="btn btn-primary">
                    Return to Homepage
                </a>
            </div>
        </div>
        
        <!-- Error State -->
        <div class="hidden" id="errorScreen">
            <div class="icon">❌</div>
            <h1>Something Went Wrong</h1>
            <p id="errorMessage">Invalid or expired unsubscribe link.</p>
            <div style="margin-top: 3rem;">
                <a href="index.html" class="btn btn-primary">
                    Return to Homepage
                </a>
            </div>
        </div>
    </div>
    
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        // On page load
        window.addEventListener('DOMContentLoaded', () => {
            if (!token) {
                showError('Invalid unsubscribe link');
                return;
            }
            
            // Show confirm screen after brief loading
            setTimeout(() => {
                document.getElementById('loading').classList.remove('active');
                document.getElementById('confirmScreen').classList.remove('hidden');
            }, 800);
        });
        
        async function confirmUnsubscribe() {
            // Show loading
            document.getElementById('confirmScreen').classList.add('hidden');
            document.getElementById('loading').classList.add('active');
            
            try {
                const res = await fetch('admin/newsletter-api.php?action=unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                
                const data = await res.json();
                
                setTimeout(() => {
                    document.getElementById('loading').classList.remove('active');
                    
                    if (data.success) {
                        document.getElementById('successScreen').classList.remove('hidden');
                    } else {
                        showError(data.message);
                    }
                }, 1000);
                
            } catch (error) {
                setTimeout(() => {
                    showError('Server error. Please try again later.');
                }, 1000);
            }
        }
        
        function showError(message) {
            document.getElementById('loading').classList.remove('active');
            document.getElementById('confirmScreen').classList.add('hidden');
            document.getElementById('errorMessage').textContent = message;
            document.getElementById('errorScreen').classList.remove('hidden');
        }
    </script>
</body>
</html>
