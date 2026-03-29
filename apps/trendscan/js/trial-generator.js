// ===== TRIAL LICENSE GENERATOR JAVASCRIPT =====

// AES Encryption (Simple implementation for demo - use proper crypto library in production)
class SimpleAES {
    static encrypt(text, key) {
        // Simple XOR encryption for demo (replace with proper AES in production)
        let result = '';
        const keyBytes = this.stringToBytes(key.padEnd(16, '0').substring(0, 16));
        const textBytes = this.stringToBytes(text);
        
        for (let i = 0; i < textBytes.length; i++) {
            result += String.fromCharCode(textBytes[i] ^ keyBytes[i % keyBytes.length]);
        }
        
        return btoa(result); // Base64 encode
    }
    
    static stringToBytes(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            bytes.push(str.charCodeAt(i));
        }
        return bytes;
    }
}

class TrialLicenseGenerator {
    constructor() {
        this.encryptionKey = "TrendScan2024Pro"; // 16 bytes key
        this.currentLicense = null;
        this.initializeGenerator();
    }
    
    initializeGenerator() {
        // Pre-fill device ID helper
        this.showDeviceIdHelper();
        
        // Add real-time validation
        this.initializeValidation();
        
        // Add form auto-save
        this.initializeAutoSave();
    }
    
    showDeviceIdHelper() {
        const deviceField = document.getElementById('trialDevice');
        if (deviceField) {
            deviceField.addEventListener('focus', () => {
                if (!deviceField.value) {
                    this.showDeviceIdInstructions();
                }
            });
        }
    }
    
    showDeviceIdInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'device-id-helper';
        instructions.innerHTML = `
            <div class="helper-content">
                <h4><i class="fas fa-mobile-alt"></i> How to find your Device ID</h4>
                <ol>
                    <li>Install TrendScan app on your Android device</li>
                    <li>Open the app and go to <strong>Settings</strong></li>
                    <li>Tap on <strong>About</strong> or <strong>Device Info</strong></li>
                    <li>Copy the <strong>Device ID</strong> shown</li>
                    <li>Paste it in the field above</li>
                </ol>
                <p><i class="fas fa-info-circle"></i> Your Device ID is unique and ensures your license works only on your device.</p>
                <button onclick="this.parentElement.parentElement.remove()" class="helper-close">Got it!</button>
            </div>
        `;
        
        instructions.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            max-width: 400px;
            width: 90%;
        `;
        
        const overlay = document.createElement('div');
        overlay.className = 'helper-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9999;
        `;
        
        overlay.addEventListener('click', () => {
            overlay.remove();
            instructions.remove();
        });
        
        document.body.appendChild(overlay);
        document.body.appendChild(instructions);
    }
    
    initializeValidation() {
        const fields = ['trialCompany', 'trialOwner', 'trialPhone', 'trialEmail', 'trialDevice'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.validateField(field));
                field.addEventListener('blur', () => this.validateField(field));
            }
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const fieldType = field.type || field.tagName.toLowerCase();
        let isValid = true;
        let message = '';
        
        // Remove previous validation
        this.removeFieldValidation(field);
        
        if (!value) {
            isValid = false;
            message = 'This field is required';
        } else {
            switch (field.id) {
                case 'trialEmail':
                    isValid = this.isValidEmail(value);
                    message = isValid ? '' : 'Please enter a valid email address';
                    break;
                case 'trialPhone':
                    isValid = this.isValidPhone(value);
                    message = isValid ? '' : 'Please enter a valid phone number';
                    break;
                case 'trialDevice':
                    isValid = value.length >= 10;
                    message = isValid ? '' : 'Device ID should be at least 10 characters';
                    break;
                case 'trialCompany':
                case 'trialOwner':
                    isValid = value.length >= 2;
                    message = isValid ? '' : 'Please enter at least 2 characters';
                    break;
            }
        }
        
        this.showFieldValidation(field, isValid, message);
        return isValid;
    }
    
    showFieldValidation(field, isValid, message) {
        field.style.borderColor = isValid ? '#00cc66' : '#ff3366';
        
        if (!isValid && message) {
            const error = document.createElement('div');
            error.className = 'field-error';
            error.textContent = message;
            error.style.cssText = `
                color: #ff3366;
                font-size: 0.85rem;
                margin-top: 0.3rem;
                font-weight: 500;
            `;
            field.parentElement.appendChild(error);
        }
    }
    
    removeFieldValidation(field) {
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderColor = '';
    }
    
    initializeAutoSave() {
        const fields = ['trialCompany', 'trialOwner', 'trialPhone', 'trialEmail', 'trialDevice', 'trialType'];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Load saved value
                const savedValue = localStorage.getItem(`trendscan_${fieldId}`);
                if (savedValue && !field.value) {
                    field.value = savedValue;
                }
                
                // Save on change
                field.addEventListener('input', () => {
                    localStorage.setItem(`trendscan_${fieldId}`, field.value);
                });
            }
        });
    }
    
    generateTrialLicense(duration = null) {
        try {
            // Get form values
            const company = document.getElementById('trialCompany').value.trim();
            const owner = document.getElementById('trialOwner').value.trim();
            const phone = document.getElementById('trialPhone').value.trim();
            const email = document.getElementById('trialEmail').value.trim();
            const deviceId = document.getElementById('trialDevice').value.trim();
            const trialType = duration || document.getElementById('trialType').value;
            
            // Validate all fields
            const fields = [
                { id: 'trialCompany', value: company, name: 'Company Name' },
                { id: 'trialOwner', value: owner, name: 'Owner Name' },
                { id: 'trialPhone', value: phone, name: 'Phone Number' },
                { id: 'trialEmail', value: email, name: 'Email Address' },
                { id: 'trialDevice', value: deviceId, name: 'Device ID' }
            ];
            
            for (let field of fields) {
                if (!field.value) {
                    this.showError(`${field.name} is required`);
                    document.getElementById(field.id).focus();
                    return;
                }
            }
            
            // Additional validation
            if (!this.isValidEmail(email)) {
                this.showError('Please enter a valid email address');
                document.getElementById('trialEmail').focus();
                return;
            }
            
            if (deviceId.length < 10) {
                this.showError('Device ID must be at least 10 characters long');
                document.getElementById('trialDevice').focus();
                return;
            }
            
            // Show loading
            this.showLoading();
            
            // Generate license after delay for UX
            setTimeout(() => {
                const licenseData = this.createLicenseData({
                    company, owner, phone, email, deviceId, trialType
                });
                
                const encryptedLicense = this.encryptLicense(licenseData);
                
                this.currentLicense = {
                    data: licenseData,
                    encrypted: encryptedLicense,
                    filename: this.generateFilename(company)
                };
                
                this.hideLoading();
                this.showLicenseModal();
                this.clearAutoSavedData();
                
            }, 2000);
            
        } catch (error) {
            this.hideLoading();
            this.showError('Error generating license: ' + error.message);
            console.error('License generation error:', error);
        }
    }
    
    createLicenseData(params) {
        const { company, owner, phone, email, deviceId, trialType } = params;
        
        const issueDate = Date.now();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(trialType));
        
        const maxItems = 50; // Trial limit
        const licenseType = `TRIAL_${trialType}_FREE`;
        
        return {
            version: "1.0",
            licenseType,
            companyName: company,
            ownerName: owner,
            phoneNumber: phone,
            email,
            deviceId,
            issueDate,
            expiryDate: expiryDate.getTime(),
            maxItems,
            issuedBy: "OMEGA_TEKSOLUTIONS",
            signature: this.generateSignature({
                company, owner, deviceId, issueDate, expiryDate: expiryDate.getTime()
            })
        };
    }
    
    generateSignature(data) {
        // Create a simple signature for validation
        const signatureData = `${data.company}:${data.owner}:${data.deviceId}:${data.issueDate}:${data.expiryDate}`;
        return btoa(signatureData).substring(0, 32);
    }
    
    encryptLicense(licenseData) {
        const licenseString = this.formatLicenseString(licenseData);
        return SimpleAES.encrypt(licenseString, this.encryptionKey);
    }
    
    formatLicenseString(data) {
        return `TRENDSCAN_LICENSE
VERSION=${data.version}
LICENSE_TYPE=${data.licenseType}
COMPANY_NAME=${data.companyName}
OWNER_NAME=${data.ownerName}
PHONE_NUMBER=${data.phoneNumber}
EMAIL=${data.email}
DEVICE_ID=${data.deviceId}
ISSUE_DATE=${data.issueDate}
EXPIRY_DATE=${data.expiryDate}
MAX_ITEMS=${data.maxItems}
ISSUED_BY=${data.issuedBy}
SIGNATURE=${data.signature}`;
    }
    
    generateFilename(company) {
        const cleanName = company.replace(/[^a-zA-Z0-9]/g, '_');
        const timestamp = new Date().toISOString().split('T')[0];
        return `${cleanName}_TrendScan_Trial_${timestamp}.lic`;
    }
    
    showLicenseModal() {
        const modal = document.getElementById('licenseModal');
        if (!modal) return;
        
        // Update modal content
        document.getElementById('licenseCompany').textContent = this.currentLicense.data.companyName;
        document.getElementById('licenseDuration').textContent = `${this.currentLicense.data.licenseType.includes('7') ? '7' : '60'} Days`;
        document.getElementById('licenseDevice').textContent = this.currentLicense.data.deviceId;
        
        modal.style.display = 'block';
        
        // Add success animation
        const modalContent = modal.querySelector('.modal-content');
        modalContent.style.animation = 'modalSlideIn 0.3s ease';
    }
    
    downloadLicenseFile() {
        if (!this.currentLicense) {
            this.showError('No license generated');
            return;
        }
        
        try {
            const blob = new Blob([this.currentLicense.encrypted], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = this.currentLicense.filename;
            link.click();
            
            window.URL.revokeObjectURL(url);
            
            this.showSuccess('License file downloaded successfully!');
            
            // Analytics
            this.trackEvent('license_downloaded', {
                type: this.currentLicense.data.licenseType,
                company: this.currentLicense.data.companyName
            });
            
        } catch (error) {
            this.showError('Error downloading license file: ' + error.message);
        }
    }
    
    emailLicense() {
        if (!this.currentLicense) {
            this.showError('No license generated');
            return;
        }
        
        const subject = encodeURIComponent('Your TrendScan Trial License');
        const body = encodeURIComponent(`Dear ${this.currentLicense.data.ownerName},

Thank you for choosing TrendScan Pro! Your trial license has been generated.

Company: ${this.currentLicense.data.companyName}
Trial Duration: ${this.currentLicense.data.licenseType.includes('7') ? '7' : '60'} days
Device ID: ${this.currentLicense.data.deviceId}

Please download the license file and import it into the TrendScan app.

For support, contact us:
- WhatsApp: +27 73 653 8207
- Email: sales@omegateksolutions.co.za

Best regards,
Omega TekSolutions Team`);
        
        window.open(`mailto:${this.currentLicense.data.email}?subject=${subject}&body=${body}`);
        
        this.showSuccess('Email client opened with license details');
    }
    
    // Helper Methods
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    isValidPhone(phone) {
        return /^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone);
    }
    
    showLoading() {
        const button = document.querySelector('.trial-generate-btn');
        if (button) {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating License...';
            button.disabled = true;
        }
        
        // Show progress indicator
        this.showProgressIndicator();
    }
    
    hideLoading() {
        const button = document.querySelector('.trial-generate-btn');
        if (button) {
            button.innerHTML = '<i class="fas fa-key"></i> Generate Trial License';
            button.disabled = false;
        }
        
        this.hideProgressIndicator();
    }
    
    showProgressIndicator() {
        const progress = document.createElement('div');
        progress.id = 'licenseProgress';
        progress.innerHTML = `
            <div class="progress-content">
                <div class="progress-steps">
                    <div class="progress-step active">
                        <i class="fas fa-check"></i>
                        <span>Validating Data</span>
                    </div>
                    <div class="progress-step" id="step2">
                        <i class="fas fa-cog fa-spin"></i>
                        <span>Generating License</span>
                    </div>
                    <div class="progress-step" id="step3">
                        <i class="fas fa-lock"></i>
                        <span>Encrypting</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            </div>
        `;
        
        progress.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            width: 400px;
            max-width: 90%;
        `;
        
        document.body.appendChild(progress);
        
        // Animate progress
        setTimeout(() => {
            document.getElementById('step2').classList.add('active');
            document.querySelector('.progress-fill').style.width = '66%';
        }, 800);
        
        setTimeout(() => {
            document.getElementById('step3').classList.add('active');
            document.querySelector('.progress-fill').style.width = '100%';
        }, 1600);
    }
    
    hideProgressIndicator() {
        const progress = document.getElementById('licenseProgress');
        if (progress) {
            progress.remove();
        }
    }
    
    clearAutoSavedData() {
        const fields = ['trialCompany', 'trialOwner', 'trialPhone', 'trialEmail', 'trialDevice', 'trialType'];
        fields.forEach(fieldId => {
            localStorage.removeItem(`trendscan_${fieldId}`);
        });
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        // Use the global notification function from main.js
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message); // Fallback
        }
    }
    
    trackEvent(eventName, data) {
        // Analytics tracking
        console.log('Event:', eventName, data);
        // Implement Google Analytics or other tracking here
    }
}

// Initialize the license generator
const licenseGenerator = new TrialLicenseGenerator();

// Global functions for HTML events
window.generateTrialLicense = function(duration) {
    licenseGenerator.generateTrialLicense(duration);
};

window.downloadLicenseFile = function() {
    licenseGenerator.downloadLicenseFile();
};

window.emailLicense = function() {
    licenseGenerator.emailLicense();
};

// Add progress indicator CSS
const progressStyle = document.createElement('style');
progressStyle.textContent = `
    .progress-steps {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1.5rem;
    }
    
    .progress-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        border-radius: 10px;
        background: #f8fafc;
        color: #64748b;
        transition: all 0.3s ease;
        flex: 1;
        margin: 0 0.5rem;
    }
    
    .progress-step.active {
        background: linear-gradient(135deg, #0066cc, #0099ff);
        color: white;
    }
    
    .progress-step i {
        font-size: 1.5rem;
    }
    
    .progress-step span {
        font-size: 0.9rem;
        font-weight: 600;
    }
    
    .progress-bar {
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #0066cc, #0099ff);
        width: 33%;
        transition: width 0.8s ease;
    }
    
    .field-error {
        animation: shake 0.3s ease;
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(progressStyle);