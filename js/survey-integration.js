// Survey data collection and integration functions

// Survey form data collection for basic applicant info
function collectBasicSurveyData() {
    const formData = {};
    
    // Basic personal information
    const personalInfo = {};
    personalInfo.name = document.querySelector('input[placeholder="田中太郎"]')?.value || '';
    personalInfo.nameKana = document.querySelector('input[placeholder="タナカタロウ"]')?.value || '';
    personalInfo.birthDate = document.querySelectorAll('input[type="date"]')[0]?.value || '';
    personalInfo.gender = document.querySelectorAll('select')[0]?.value || '';
    personalInfo.phoneNumber = document.querySelector('input[placeholder="03-1234-5678"]')?.value || '';
    personalInfo.email = document.querySelector('input[placeholder="taro@example.com"]')?.value || '';
    personalInfo.postalCode = document.querySelector('input[placeholder="123-4567"]')?.value || '';
    personalInfo.address = document.querySelector('input[placeholder="東京都新宿区西新宿1-1-1"]')?.value || '';
    
    formData.personalInfo = personalInfo;
    
    // Disability certificate info
    const disabilityInfo = {};
    const hasDisabilityCertificate = document.querySelector('input[name="hasDisabilityCertificate"]:checked')?.value === 'yes';
    disabilityInfo.hasDisabilityCertificate = hasDisabilityCertificate;
    
    if (hasDisabilityCertificate) {
        disabilityInfo.certificateNumber = document.querySelector('input[placeholder="障害者手帳番号"]')?.value || '';
        disabilityInfo.issueDate = document.querySelector('input[placeholder="発行日"]')?.value || '';
        disabilityInfo.grade = document.querySelector('select[name="disabilityGrade"]')?.value || '';
    }
    
    formData.disabilityInfo = disabilityInfo;
    
    // Bank account info
    const bankInfo = {};
    const bankType = document.querySelector('input[name="bankType"]:checked')?.value || '';
    bankInfo.bankType = bankType;
    
    if (bankType === 'regular') {
        bankInfo.bankName = document.querySelector('input[placeholder="○○銀行"]')?.value || '';
        bankInfo.branchName = document.querySelector('input[placeholder="○○支店"]')?.value || '';
        bankInfo.accountType = document.querySelector('select[name="accountType"]')?.value || '';
        bankInfo.accountNumber = document.querySelector('input[placeholder="1234567"]')?.value || '';
        bankInfo.accountHolderKana = document.querySelector('input[placeholder="タナカタロウ"]')?.value || '';
    } else if (bankType === 'yucho') {
        bankInfo.yuchoSymbol = document.querySelector('input[placeholder="記号（5桁）"]')?.value || '';
        bankInfo.yuchoNumber = document.querySelector('input[placeholder="番号（8桁以内）"]')?.value || '';
        bankInfo.accountHolderKana = document.querySelector('input[placeholder="タナカタロウ"]')?.value || '';
    }
    
    formData.bankInfo = bankInfo;
    
    // Family information
    const familyInfo = {};
    
    // Spouse info
    const hasSpouse = document.querySelector('input[name="hasSpouse"]:checked')?.value === 'true';
    familyInfo.hasSpouse = hasSpouse;
    
    if (hasSpouse) {
        const spouseInfo = {};
        const spouseInputs = document.getElementById('spouseInfo')?.querySelectorAll('input, select') || [];
        if (spouseInputs.length >= 5) {
            spouseInfo.name = spouseInputs[0].value || '';
            spouseInfo.nameKana = spouseInputs[1].value || '';
            spouseInfo.myNumber = spouseInputs[2].value || '';
            spouseInfo.basicPensionNumber = spouseInputs[3].value || '';
            spouseInfo.birthDate = spouseInputs[4].value || '';
            spouseInfo.occupation = spouseInputs[5]?.value || '';
        }
        familyInfo.spouse = spouseInfo;
    }
    
    // Children info
    const children = [];
    const childCards = document.getElementById('childrenList')?.querySelectorAll('.border.border-notion-gray-200') || [];
    
    childCards.forEach(card => {
        const inputs = card.querySelectorAll('input, select');
        if (inputs.length >= 4) {
            children.push({
                name: inputs[0].value || '',
                nameKana: inputs[1].value || '',
                myNumber: inputs[2].value || '',
                birthDate: inputs[3].value || ''
            });
        }
    });
    
    familyInfo.children = children;
    formData.familyInfo = familyInfo;
    
    return formData;
}

// Survey form data collection for pre-application survey
function collectPreApplicationSurveyData() {
    const formData = {};
    
    // Collect all radio button responses
    const questions = [
        'workStatus',
        'hasJob',
        'hasPension',
        'hasDisabilityCertificate',
        'hasHouseholdHead',
        'hasSavings',
        'hasDebt',
        'hasInsurance'
    ];
    
    questions.forEach(question => {
        const selectedOption = document.querySelector(`input[name="${question}"]:checked`);
        if (selectedOption) {
            formData[question] = selectedOption.value;
        }
    });
    
    // Collect text inputs
    const textInputs = document.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach((input, index) => {
        if (input.name) {
            formData[input.name] = input.value;
        }
    });
    
    return formData;
}

// Survey form data collection for injury information
function collectInjurySurveyData() {
    const formData = {};
    
    // Basic injury information
    formData.injuryName = document.querySelector('input[placeholder="例：うつ病、統合失調症、腰椎ヘルニアなど"]')?.value || '';
    formData.onsetDate = document.querySelector('input[type="date"]')?.value || '';
    formData.currentSymptoms = document.querySelector('textarea[placeholder="現在の症状について詳しく記載してください"]')?.value || '';
    
    // Medical institution information
    formData.hospitalName = document.querySelector('input[placeholder="○○病院、○○クリニック"]')?.value || '';
    formData.doctorName = document.querySelector('input[placeholder="田中医師"]')?.value || '';
    formData.firstVisitDate = document.querySelectorAll('input[type="date"]')[1]?.value || '';
    
    // Document types (tabs)
    const documentTypes = [];
    const documentTabs = document.querySelectorAll('.document-tab-content');
    
    documentTabs.forEach((tab, index) => {
        if (tab.style.display !== 'none') {
            const documentType = {};
            const inputs = tab.querySelectorAll('input, select, textarea');
            
            documentType.tabNumber = index + 1;
            documentType.documentName = inputs[0]?.value || '';
            documentType.issueDate = inputs[1]?.value || '';
            documentType.issuer = inputs[2]?.value || '';
            documentType.notes = inputs[3]?.value || '';
            
            documentTypes.push(documentType);
        }
    });
    
    formData.documentTypes = documentTypes;
    
    return formData;
}

// Save survey data to backend
async function saveSurveyData(surveyType) {
    try {
        // Get application ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const applicationId = urlParams.get('id');
        
        if (!applicationId) {
            throw new Error('Application ID not found');
        }
        
        let surveyData;
        let status = 'completed';
        
        // Collect data based on survey type
        switch (surveyType) {
            case 'basic':
                surveyData = collectBasicSurveyData();
                break;
            case 'pre_application':
                surveyData = collectPreApplicationSurveyData();
                break;
            case 'injury':  
                surveyData = collectInjurySurveyData();
                break;
            default:
                throw new Error('Invalid survey type');
        }
        
        // Save to backend
        const result = await SurveyAPI.saveSurvey(applicationId, surveyType, surveyData, status);
        
        // Show success notification
        showNotification('アンケートデータを保存しました', 'success');
        
        // Send completion message to parent window
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'surveyCompleted',
                surveyType: surveyType,
                applicationId: applicationId,
                completedDate: new Date().toLocaleString('ja-JP'),
                data: surveyData
            }, '*');
        }
        
        return result;
        
    } catch (error) {
        console.error('Error saving survey data:', error);
        showNotification('アンケートデータの保存に失敗しました', 'error');
        throw error;
    }
}

// Load survey data from backend
async function loadSurveyData(surveyType) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const applicationId = urlParams.get('id');
        
        if (!applicationId) {
            return null;
        }
        
        const result = await SurveyAPI.getSurvey(applicationId, surveyType);
        
        if (result && result.survey) {
            const surveyData = getSurveyDataByType(result.survey, surveyType);
            if (surveyData) {
                populateSurveyForm(surveyType, surveyData);
                return surveyData;
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Error loading survey data:', error);
        return null;
    }
}

// Get survey data by type from survey object
function getSurveyDataByType(survey, surveyType) {
    switch (surveyType) {
        case 'basic':
            return survey.basicInfo;
        case 'pre_application':
            return survey.preApplicationInfo;
        case 'injury':
            return survey.injuryInfo;
        default:
            return null;
    }
}

// Populate survey form with data
function populateSurveyForm(surveyType, data) {
    switch (surveyType) {
        case 'basic':
            populateBasicSurveyForm(data);
            break;
        case 'pre_application':
            populatePreApplicationSurveyForm(data);
            break;
        case 'injury':
            populateInjurySurveyForm(data);
            break;
    }
}

// Populate basic survey form
function populateBasicSurveyForm(data) {
    if (!data) return;
    
    // Personal info
    if (data.personalInfo) {
        const nameInput = document.querySelector('input[placeholder="田中太郎"]');
        if (nameInput) nameInput.value = data.personalInfo.name || '';
        
        const kanaInput = document.querySelector('input[placeholder="タナカタロウ"]');
        if (kanaInput) kanaInput.value = data.personalInfo.nameKana || '';
        
        const birthDateInput = document.querySelectorAll('input[type="date"]')[0];
        if (birthDateInput) birthDateInput.value = data.personalInfo.birthDate || '';
        
        const genderSelect = document.querySelectorAll('select')[0];
        if (genderSelect) genderSelect.value = data.personalInfo.gender || '';
        
        // Continue with other fields...
    }
    
    // Bank info
    if (data.bankInfo) {
        const bankTypeRadio = document.querySelector(`input[name="bankType"][value="${data.bankInfo.bankType}"]`);
        if (bankTypeRadio) {
            bankTypeRadio.checked = true;
            bankTypeRadio.dispatchEvent(new Event('change'));
        }
    }
    
    // Family info
    if (data.familyInfo) {
        if (data.familyInfo.hasSpouse) {
            const spouseYesRadio = document.querySelector('input[name="hasSpouse"][value="true"]');
            if (spouseYesRadio) {
                spouseYesRadio.checked = true;
                spouseYesRadio.dispatchEvent(new Event('change'));
            }
        }
    }
}

// Populate pre-application survey form
function populatePreApplicationSurveyForm(data) {
    if (!data) return;
    
    Object.keys(data).forEach(key => {
        const radio = document.querySelector(`input[name="${key}"][value="${data[key]}"]`);
        if (radio) radio.checked = true;
        
        const textInput = document.querySelector(`input[name="${key}"], textarea[name="${key}"]`);
        if (textInput) textInput.value = data[key] || '';
    });
}

// Populate injury survey form
function populateInjurySurveyForm(data) {
    if (!data) return;
    
    const injuryNameInput = document.querySelector('input[placeholder="例：うつ病、統合失調症、腰椎ヘルニアなど"]');
    if (injuryNameInput) injuryNameInput.value = data.injuryName || '';
    
    const onsetDateInput = document.querySelector('input[type="date"]');
    if (onsetDateInput) onsetDateInput.value = data.onsetDate || '';
    
    const symptomsInput = document.querySelector('textarea[placeholder="現在の症状について詳しく記載してください"]');
    if (symptomsInput) symptomsInput.value = data.currentSymptoms || '';
    
    const hospitalInput = document.querySelector('input[placeholder="○○病院、○○クリニック"]');
    if (hospitalInput) hospitalInput.value = data.hospitalName || '';
    
    const doctorInput = document.querySelector('input[placeholder="田中医師"]');  
    if (doctorInput) doctorInput.value = data.doctorName || '';
}

// Auto-save functionality
function enableAutoSave(surveyType, interval = 30000) {
    setInterval(async () => {
        try {
            await saveSurveyData(surveyType);
            console.log('Auto-saved survey data');
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }, interval);
}

// Initialize survey integration on page load
document.addEventListener('DOMContentLoaded', () => {
    // Determine survey type based on current page
    let surveyType = null;
    
    if (window.location.pathname.includes('survey-form.html')) {
        surveyType = 'basic';
    } else if (window.location.pathname.includes('survey-pre-application.html')) {
        surveyType = 'pre_application';
    } else if (window.location.pathname.includes('survey-injury.html')) {
        surveyType = 'injury';
    }
    
    if (surveyType) {
        // Load existing data
        loadSurveyData(surveyType);
        
        // Enable auto-save every 30 seconds
        enableAutoSave(surveyType);
        
        // Add save button functionality
        const saveButton = document.querySelector('#saveSurveyBtn, .save-button, [onclick*="save"]');
        if (saveButton) {
            saveButton.addEventListener('click', (e) => {
                e.preventDefault();
                saveSurveyData(surveyType);
            });
        }
    }
});