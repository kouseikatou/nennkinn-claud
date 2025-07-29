// API configuration
const API_BASE_URL = 'http://localhost:3002/api';

// Application API service
const ApplicationAPI = {
    // Get all applications
    async getApplications(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE_URL}/applications?${queryString}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch applications');
            return await response.json();
        } catch (error) {
            console.error('Error fetching applications:', error);
            throw error;
        }
    },

    // Get single application
    async getApplication(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch application');
            return await response.json();
        } catch (error) {
            console.error('Error fetching application:', error);
            throw error;
        }
    },

    // Create new application
    async createApplication(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to create application');
            return await response.json();
        } catch (error) {
            console.error('Error creating application:', error);
            throw error;
        }
    },

    // Update application
    async updateApplication(id, data) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to update application');
            return await response.json();
        } catch (error) {
            console.error('Error updating application:', error);
            throw error;
        }
    },

    // Delete application
    async deleteApplication(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/applications/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) throw new Error('Failed to delete application');
            return await response.json();
        } catch (error) {
            console.error('Error deleting application:', error);
            throw error;
        }
    }
};

// Form data collection helper
function collectFormData() {
    const formData = {
        // Basic information
        applicantName: document.querySelector('input[placeholder="田中太郎"]')?.value || '',
        applicantNameKana: document.querySelector('input[placeholder="タナカタロウ"]')?.value || '',
        birthDate: document.querySelectorAll('input[type="date"]')[0]?.value || '',
        gender: document.querySelectorAll('select')[0]?.value || '',
        phoneNumber: document.querySelector('input[placeholder="03-1234-5678"]')?.value || '',
        email: document.querySelector('input[placeholder="taro@example.com"]')?.value || '',
        postalCode: document.querySelector('input[placeholder="123-4567"]')?.value || '',
        address: document.querySelector('input[placeholder="東京都新宿区西新宿1-1-1"]')?.value || '',
        
        // Disability information
        disabilityType: document.querySelectorAll('select')[1]?.value || '',
        disabilityDescription: document.querySelector('input[placeholder="うつ病、統合失調症など"]')?.value || '',
        onsetDate: document.querySelectorAll('input[type="date"]')[1]?.value || '',
        disabilityGrade: document.querySelectorAll('select')[2]?.value || '',
        
        // Medical information
        hospitalName: document.querySelector('input[placeholder="○○病院、○○クリニック"]')?.value || '',
        doctorName: document.querySelector('input[placeholder="田中医師"]')?.value || '',
        
        // Family members
        familyMembers: collectFamilyMembers()
    };
    
    return formData;
}

// Collect family members data
function collectFamilyMembers() {
    const familyMembers = [];
    
    // Collect spouse data if exists
    const hasSpouse = document.querySelector('input[name="hasSpouse"]:checked')?.value === 'true';
    if (hasSpouse) {
        const spouseInputs = document.getElementById('spouseInfo').querySelectorAll('input, select');
        if (spouseInputs.length >= 5) {
            familyMembers.push({
                memberType: 'spouse',
                name: spouseInputs[0].value,
                nameKana: spouseInputs[1].value,
                myNumber: spouseInputs[2].value,
                basicPensionNumber: spouseInputs[3].value,
                birthDate: spouseInputs[4].value
            });
        }
    }
    
    // Collect children data
    const childrenList = document.getElementById('childrenList');
    const childCards = childrenList.querySelectorAll('.border.border-notion-gray-200');
    
    childCards.forEach(card => {
        const inputs = card.querySelectorAll('input, select');
        if (inputs.length >= 4) {
            familyMembers.push({
                memberType: 'child',
                name: inputs[0].value,
                nameKana: inputs[1].value,
                myNumber: inputs[2].value,
                birthDate: inputs[3].value
            });
        }
    });
    
    return familyMembers;
}

// Save application
async function saveApplication() {
    try {
        const formData = collectFormData();
        const urlParams = new URLSearchParams(window.location.search);
        const applicationId = urlParams.get('edit');
        
        let result;
        if (applicationId && applicationId !== 'new') {
            // Update existing application
            result = await ApplicationAPI.updateApplication(applicationId, formData);
            showNotification('申請情報を更新しました', 'success');
        } else {
            // Create new application
            result = await ApplicationAPI.createApplication(formData);
            showNotification('新規申請を作成しました', 'success');
            
            // Redirect to edit mode with new ID
            window.location.href = `project-unified.html?edit=${result.application.id}`;
        }
    } catch (error) {
        console.error('Error saving application:', error);
        showNotification('保存中にエラーが発生しました', 'error');
    }
}

// Load application data
async function loadApplication(applicationId) {
    try {
        const result = await ApplicationAPI.getApplication(applicationId);
        const application = result.application;
        
        // Populate form fields
        populateFormFields(application);
        
        // Populate family members
        if (application.familyMembers && application.familyMembers.length > 0) {
            populateFamilyMembers(application.familyMembers);
        }
    } catch (error) {
        console.error('Error loading application:', error);
        showNotification('データの読み込みに失敗しました', 'error');
    }
}

// Populate form fields
function populateFormFields(data) {
    // Basic information
    const nameInput = document.querySelector('input[placeholder="田中太郎"]');
    if (nameInput) nameInput.value = data.applicantName || '';
    
    const kanaInput = document.querySelector('input[placeholder="タナカタロウ"]');
    if (kanaInput) kanaInput.value = data.applicantNameKana || '';
    
    const birthDateInput = document.querySelectorAll('input[type="date"]')[0];
    if (birthDateInput) birthDateInput.value = data.birthDate || '';
    
    const genderSelect = document.querySelectorAll('select')[0];
    if (genderSelect) genderSelect.value = data.gender || '';
    
    const phoneInput = document.querySelector('input[placeholder="03-1234-5678"]');
    if (phoneInput) phoneInput.value = data.phoneNumber || '';
    
    const emailInput = document.querySelector('input[placeholder="taro@example.com"]');
    if (emailInput) emailInput.value = data.email || '';
    
    const postalCodeInput = document.querySelector('input[placeholder="123-4567"]');
    if (postalCodeInput) postalCodeInput.value = data.postalCode || '';
    
    const addressInput = document.querySelector('input[placeholder="東京都新宿区西新宿1-1-1"]');
    if (addressInput) addressInput.value = data.address || '';
    
    // Disability information
    const disabilityTypeSelect = document.querySelectorAll('select')[1];
    if (disabilityTypeSelect) disabilityTypeSelect.value = data.disabilityType || '';
    
    const disabilityDescInput = document.querySelector('input[placeholder="うつ病、統合失調症など"]');
    if (disabilityDescInput) disabilityDescInput.value = data.disabilityDescription || '';
    
    const onsetDateInput = document.querySelectorAll('input[type="date"]')[1];
    if (onsetDateInput) onsetDateInput.value = data.onsetDate || '';
    
    const gradeSelect = document.querySelectorAll('select')[2];
    if (gradeSelect) gradeSelect.value = data.disabilityGrade || '';
    
    // Medical information
    const hospitalInput = document.querySelector('input[placeholder="○○病院、○○クリニック"]');
    if (hospitalInput) hospitalInput.value = data.hospitalName || '';
    
    const doctorInput = document.querySelector('input[placeholder="田中医師"]');
    if (doctorInput) doctorInput.value = data.doctorName || '';
}

// Populate family members
function populateFamilyMembers(familyMembers) {
    const spouse = familyMembers.find(m => m.memberType === 'spouse');
    const children = familyMembers.filter(m => m.memberType === 'child');
    
    // Populate spouse
    if (spouse) {
        const spouseYesRadio = document.querySelector('input[name="hasSpouse"][value="true"]');
        if (spouseYesRadio) {
            spouseYesRadio.checked = true;
            spouseYesRadio.dispatchEvent(new Event('change'));
        }
        
        setTimeout(() => {
            const spouseInputs = document.getElementById('spouseInfo').querySelectorAll('input');
            if (spouseInputs.length >= 5) {
                spouseInputs[0].value = spouse.name || '';
                spouseInputs[1].value = spouse.nameKana || '';
                spouseInputs[2].value = spouse.myNumber || '';
                spouseInputs[3].value = spouse.basicPensionNumber || '';
                spouseInputs[4].value = spouse.birthDate || '';
            }
        }, 100);
    }
    
    // Populate children
    children.forEach((child, index) => {
        // Add child form
        if (typeof addChild === 'function') {
            addChild();
            
            setTimeout(() => {
                const childCards = document.getElementById('childrenList').querySelectorAll('.border.border-notion-gray-200');
                const lastCard = childCards[childCards.length - 1];
                
                if (lastCard) {
                    const inputs = lastCard.querySelectorAll('input');
                    if (inputs.length >= 4) {
                        inputs[0].value = child.name || '';
                        inputs[1].value = child.nameKana || '';
                        inputs[2].value = child.myNumber || '';
                        inputs[3].value = child.birthDate || '';
                    }
                }
            }, 100 * (index + 1));
        }
    });
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transition-all duration-300 z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('edit');
    
    if (applicationId && applicationId !== 'new') {
        loadApplication(applicationId);
    }
});