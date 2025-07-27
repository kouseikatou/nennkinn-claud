// Projects list management
const ProjectsList = {
    // Sample data for UI demonstration
    sampleApplications: [
        {
            id: 1,
            applicantName: '田中太郎',
            status: 'under_review',
            disabilityDescription: 'うつ病',
            applicationType: 'new',
            onsetDate: '2023-05-10',
            monthlyAmount: 300000,
            createdAt: '2024-01-15',
            assignee: { name: '佐藤花子' },
            familyMembers: [
                { memberType: 'spouse', name: '田中花子' },
                { memberType: 'child', name: '田中一郎' },
                { memberType: 'child', name: '田中次郎' }
            ]
        },
        {
            id: 2,
            applicantName: '山田花子',
            status: 'approved',
            disabilityDescription: '統合失調症',
            applicationType: 'new',
            onsetDate: '2022-03-15',
            monthlyAmount: 250000,
            createdAt: '2023-08-01',
            assignee: { name: '田中一郎' },
            familyMembers: []
        },
        {
            id: 3,
            applicantName: '佐藤一郎',
            status: 'approved',
            disabilityDescription: '腰椎椎間板ヘルニア',
            applicationType: 'renewal',
            onsetDate: '2021-08-10',
            monthlyAmount: 400000,
            createdAt: '2023-06-01',
            assignee: { name: '山田太郎' },
            familyMembers: [
                { memberType: 'spouse', name: '佐藤美香' },
                { memberType: 'child', name: '佐藤健太' },
                { memberType: 'child', name: '佐藤美穂' },
                { memberType: 'child', name: '佐藤大輔' }
            ]
        },
        {
            id: 4,
            applicantName: '鈴木次郎',
            status: 'draft',
            disabilityDescription: '双極性障害',
            applicationType: 'new',
            onsetDate: '2023-12-01',
            monthlyAmount: 280000,
            createdAt: '2024-02-10',
            assignee: { name: '高橋美里' },
            familyMembers: [
                { memberType: 'spouse', name: '鈴木恵子' }
            ]
        },
        {
            id: 5,
            applicantName: '高橋三郎',
            status: 'rejected',
            disabilityDescription: '関節リウマチ',
            applicationType: 'appeal',
            onsetDate: '2022-11-20',
            monthlyAmount: 0,
            createdAt: '2023-12-15',
            assignee: { name: '佐藤花子' },
            familyMembers: [
                { memberType: 'child', name: '高橋優子' },
                { memberType: 'child', name: '高橋健一' }
            ]
        }
    ],

    // Initialize the projects list
    init() {
        this.loadProjects();
    },

    // Load projects (using sample data)
    loadProjects(params = {}) {
        let filteredApplications = [...this.sampleApplications];

        // Apply search filter
        if (params.search) {
            const searchTerm = params.search.toLowerCase();
            filteredApplications = filteredApplications.filter(app => 
                app.applicantName.toLowerCase().includes(searchTerm)
            );
        }

        // Apply status filter
        if (params.status) {
            filteredApplications = filteredApplications.filter(app => 
                app.status === params.status
            );
        }

        this.renderProjects(filteredApplications);
    },

    // Render projects list
    renderProjects(applications) {
        const projectsContainer = document.getElementById('projects-container');
        if (!projectsContainer) return;

        // Clear existing content except the search bar
        const searchContainer = projectsContainer.querySelector('.search-container');
        projectsContainer.innerHTML = '';
        if (searchContainer) {
            projectsContainer.appendChild(searchContainer);
        }

        // Render each application
        applications.forEach(app => {
            const projectCard = this.createProjectCard(app);
            projectsContainer.appendChild(projectCard);
        });
    },

    // Create project card element
    createProjectCard(application) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl border border-saas-200 shadow-saas hover:shadow-saas-lg transition-all duration-300 p-6 group cursor-pointer';

        // Get family composition
        const familyComposition = this.getFamilyComposition(application.familyMembers || []);

        // Get status badge
        const statusBadge = this.getStatusBadge(application.status);

        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex items-start space-x-4 flex-1">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-3">
                            <h3 class="text-lg font-semibold text-saas-900">${application.applicantName || '未設定'}</h3>
                            ${statusBadge}
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
                            <div class="space-y-1">
                                <div class="text-xs font-medium text-saas-500 uppercase tracking-wide">傷病名</div>
                                <div class="font-semibold text-saas-800">${application.disabilityDescription || '未設定'}</div>
                            </div>
                            <div class="space-y-1">
                                <div class="text-xs font-medium text-saas-500 uppercase tracking-wide">種類</div>
                                <div class="font-semibold text-saas-800">${this.getPensionType(application.applicationType)}</div>
                            </div>
                            <div class="space-y-1">
                                <div class="text-xs font-medium text-saas-500 uppercase tracking-wide">初診日</div>
                                <div class="font-semibold text-saas-800">${this.formatDate(application.onsetDate)}</div>
                            </div>
                            <div class="space-y-1">
                                <div class="text-xs font-medium text-saas-500 uppercase tracking-wide">家族構成</div>
                                <div class="font-semibold text-saas-800">${familyComposition}</div>
                            </div>
                            <div class="space-y-1">
                                <div class="text-xs font-medium text-saas-500 uppercase tracking-wide">見込み収益</div>
                                <div class="font-semibold text-saas-800">${this.formatCurrency(application.monthlyAmount)}</div>
                            </div>
                        </div>
                        <div class="flex items-center mt-4 pt-4 border-t border-saas-200">
                            <div class="flex items-center text-xs text-saas-500 space-x-4">
                                <div class="flex items-center space-x-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                                    </svg>
                                    <span>${this.formatDate(application.createdAt)}</span>
                                </div>
                                <div class="flex items-center space-x-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                                    </svg>
                                    <span>${application.assignee?.name || '未割当'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button class="p-2.5 text-saas-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 shadow-saas" onclick="event.preventDefault(); viewApplication(${application.id})" title="詳細表示">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                    <button class="p-2.5 text-saas-500 hover:text-warning-600 hover:bg-warning-50 rounded-lg transition-all duration-200 shadow-saas" onclick="event.preventDefault(); editApplication(${application.id})" title="編集">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add click handler to card (for general card clicks to view details)
        card.addEventListener('click', (e) => {
            // Only trigger if the click is on the card itself, not on buttons
            if (e.target === card || (!e.target.closest('button') && e.target.closest('.group') === card)) {
                viewApplication(application.id);
            }
        });

        return card;
    },

    // Get family composition string
    getFamilyComposition(familyMembers) {
        if (!familyMembers || familyMembers.length === 0) {
            return '配偶者無・子0名';
        }

        const spouse = familyMembers.find(m => m.memberType === 'spouse');
        const children = familyMembers.filter(m => m.memberType === 'child');

        const spouseText = spouse ? '配偶者有' : '配偶者無';
        const childrenText = `子${children.length}名`;

        return `${spouseText}・${childrenText}`;
    },

    // Get status badge HTML
    getStatusBadge(status) {
        const statusMap = {
            'draft': { text: '下書き', class: 'bg-saas-100 text-saas-700 border border-saas-300' },
            'submitted': { text: '提出済み', class: 'bg-primary-100 text-primary-700 border border-primary-300' },
            'under_review': { text: '審査中', class: 'bg-warning-100 text-warning-700 border border-warning-300' },
            'additional_docs_required': { text: '追加書類要求', class: 'bg-warning-100 text-warning-700 border border-warning-300' },
            'approved': { text: '承認済み', class: 'bg-success-100 text-success-700 border border-success-300' },
            'rejected': { text: '却下', class: 'bg-danger-100 text-danger-700 border border-danger-300' },
            'withdrawn': { text: '取下げ', class: 'bg-saas-100 text-saas-700 border border-saas-300' }
        };

        const statusInfo = statusMap[status] || statusMap['draft'];
        return `<span class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${statusInfo.class} shadow-saas">${statusInfo.text}</span>`;
    },

    // Get pension type display name
    getPensionType(applicationType) {
        const typeMap = {
            'new': '新規申請',
            'renewal': '更新申請',
            'grade_change': '等級変更',
            'appeal': '不服申立て'
        };
        return typeMap[applicationType] || '未設定';
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '未設定';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
    },

    // Format currency
    formatCurrency(amount) {
        if (!amount) return '未設定';
        return new Intl.NumberFormat('ja-JP', {
            style: 'currency',
            currency: 'JPY',
            maximumFractionDigits: 0
        }).format(amount);
    }
};

// Global variable to store current application ID for modal
let currentApplicationId = null;

// Action handlers
function viewApplication(id) {
    window.location.href = `project-unified.html?view=${id}`;
}

function editApplication(id) {
    window.location.href = `project-unified.html?edit=${id}`;
}


// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', handleSearch);
    }
}

function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    
    const searchTerm = searchInput?.value || '';
    const statusFilter_value = statusFilter?.value || '';

    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (statusFilter_value) params.status = statusFilter_value;

    ProjectsList.loadProjects(params);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the projects page
    if (window.location.pathname.includes('projects.html') || document.getElementById('projects-container')) {
        ProjectsList.init();
        setupSearch();
    }
});