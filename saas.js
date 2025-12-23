// SaaS Business Management System
class SaaSManager {
    constructor() {
        this.data = {
            leads: [],
            deals: [],
            revenue: [],
            goals: [],
            subscriptions: [],
            expenses: [],
            stats: {}
        };
        this.init();
    }


    async init() {
        await this.loadData();
        this.updateDashboard();
        this.renderLeads();
        this.renderPipeline();
        this.renderDeals();
        this.renderRevenue();
        this.renderGoals();
        this.renderSubscriptions();
        this.renderExpenses();
    }

    // Utility functions for Lead Details UI
    getActivityColor(type) {
        const colors = {
            'call': 'var(--accent-green)',
            'email': 'var(--accent-blue)',
            'sms': 'var(--accent-orange)',
            'note': 'var(--accent-purple)',
            'meeting': 'var(--accent-blue)',
            'followup': 'var(--accent-orange)'
        };
        return colors[type] || 'var(--accent-blue)';
    }

    getActivityIcon(type) {
        const icons = {
            'call': '📞',
            'email': '✉️',
            'sms': '📱',
            'note': '📝',
            'meeting': '🤝',
            'followup': '⏰'
        };
        return icons[type] || '📋';
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatRelativeTime(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(num);
    }

    formatPhoneNumber(phone) {
        // Remove all non-digits
        const cleaned = phone.replace(/\D/g, '');
        
        // Format Indian mobile number
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{5})(\d{5})/, '$1 $2');
        } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
            return '+91 ' + cleaned.slice(2).replace(/(\d{5})(\d{5})/, '$1 $2');
        }
        
        return phone; // Return original if not matching expected formats
    }

    getScoreColor(score) {
        if (score >= 80) return 'var(--accent-green)';
        if (score >= 60) return 'var(--accent-orange)';
        if (score >= 40) return 'var(--accent-blue)';
        return 'var(--accent-red)';
    }

    async loadData() {
        try {
            const response = await fetch('/api/saas/data');
            this.data = await response.json();
            await this.loadStats();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }


    async loadStats() {
        try {
            const response = await fetch('/api/saas/stats');
            this.data.stats = await response.json();
            
            // Also load advanced stats
            const advancedResponse = await fetch('/api/saas/advanced-stats');
            if (advancedResponse.ok) {
                this.data.advancedStats = await advancedResponse.json();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateDashboard() {
        const stats = this.data.stats;
        const statsContainer = document.getElementById('dashboard-stats');
        
        statsContainer.innerHTML = `
            <div class="stat-card revenue">
                <div class="stat-title">Monthly Revenue</div>
                <div class="stat-value">₹${(stats.revenue?.monthly || 0).toLocaleString()}</div>
                <div class="stat-subtitle">Recurring: ₹${(stats.revenue?.recurring || 0).toLocaleString()}</div>
            </div>
            <div class="stat-card leads">
                <div class="stat-title">Lead Conversion</div>
                <div class="stat-value">${stats.leads?.conversionRate || 0}%</div>
                <div class="stat-subtitle">${stats.leads?.converted || 0} converted from ${stats.leads?.total || 0}</div>
            </div>
            <div class="stat-card deals">
                <div class="stat-title">Pipeline Value</div>
                <div class="stat-value">₹${(stats.deals?.pipelineValue || 0).toLocaleString()}</div>
                <div class="stat-subtitle">Won: ₹${(stats.deals?.wonValue || 0).toLocaleString()}</div>
            </div>
            <div class="stat-card">
                <div class="stat-title">Active Clients</div>
                <div class="stat-value">${stats.clients?.active || 0}</div>
                <div class="stat-subtitle">Total: ${stats.clients?.total || 0}</div>
            </div>
            <div class="stat-card revenue">
                <div class="stat-title">Net Profit</div>
                <div class="stat-value">₹${(stats.revenue?.netProfit || 0).toLocaleString()}</div>
                <div class="stat-subtitle">Expenses: ₹${(stats.revenue?.expenses || 0).toLocaleString()}</div>
            </div>
            <div class="stat-card goals">
                <div class="stat-title">Goal Progress</div>
                <div class="stat-value">${stats.goals?.progress || 0}%</div>
                <div class="stat-subtitle">Target: ₹${(stats.goals?.monthlyGoal || 0).toLocaleString()}</div>
            </div>
            <div class="stat-card leads">
                <div class="stat-title">Lead Quality</div>
                <div class="stat-value">${stats.leads?.qualified || 0}</div>
                <div class="stat-subtitle">Qualified leads this month</div>
            </div>
            <div class="stat-card deals">
                <div class="stat-title">Deal Conversion</div>
                <div class="stat-value">${stats.deals?.conversionRate || 0}%</div>
                <div class="stat-subtitle">${stats.deals?.won || 0} won from ${stats.deals?.total || 0}</div>
            </div>
        `;
    }

    async addLead() {
        const leadData = {
            name: document.getElementById('leadName').value,
            email: document.getElementById('leadEmail').value,
            phone: document.getElementById('leadPhone').value,
            company: document.getElementById('leadCompany').value,
            source: document.getElementById('leadSource').value,
            service: document.getElementById('leadService').value,
            notes: document.getElementById('leadNotes').value,
            score: parseInt(document.getElementById('leadScore').value)
        };

        if (!leadData.name || !leadData.email) {
            alert('Name and Email are required');
            return;
        }

        try {
            const response = await fetch('/api/saas/lead/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });

            if (response.ok) {
                this.clearLeadForm();
                await this.loadData();
                this.renderLeads();
                this.updateDashboard();
                alert('Lead added successfully!');
            } else {
                alert('Error adding lead');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding lead');
        }
    }

    async convertLead(leadId) {
        const dealValue = prompt('Enter deal value:');
        if (!dealValue) return;

        const dealData = {
            dealValue: parseFloat(dealValue),
            service: 'General Service',
            notes: 'Converted from lead'
        };

        try {
            const response = await fetch(`/api/saas/lead/${leadId}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dealData)
            });

            if (response.ok) {
                await this.loadData();
                this.renderLeads();
                this.renderPipeline();
                this.renderDeals();
                this.updateDashboard();
                alert('Lead converted to deal successfully!');
            } else {
                alert('Error converting lead');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error converting lead');
        }
    }

    async deleteLead(leadId) {
        if (!confirm('Are you sure you want to delete this lead?')) return;

        try {
            const response = await fetch(`/api/saas/lead/${leadId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadData();
                this.renderLeads();
                this.updateDashboard();
                alert('Lead deleted successfully!');
            } else {
                alert('Error deleting lead');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting lead');
        }
    }

    async addDeal() {
        const dealData = {
            clientName: document.getElementById('dealClientName').value,
            clientEmail: document.getElementById('dealClientEmail').value,
            company: document.getElementById('dealCompany').value,
            value: parseFloat(document.getElementById('dealValue').value),
            service: document.getElementById('dealService').value,
            stage: document.getElementById('dealStage').value,
            probability: parseInt(document.getElementById('dealProbability').value),
            expectedCloseDate: document.getElementById('dealCloseDate').value,
            notes: document.getElementById('dealNotes').value
        };

        if (!dealData.clientName || !dealData.value) {
            alert('Client name and value are required');
            return;
        }

        try {
            const response = await fetch('/api/saas/deal/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dealData)
            });

            if (response.ok) {
                this.clearDealForm();
                await this.loadData();
                this.renderDeals();
                this.renderPipeline();
                this.updateDashboard();
                alert('Deal added successfully!');
            } else {
                alert('Error adding deal');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding deal');
        }
    }

    async updateDealStage(dealId, newStage) {
        const probabilityMap = {
            'Prospecting': 10,
            'Qualified': 25,
            'Proposal': 50,
            'Negotiation': 75,
            'Closed Won': 100,
            'Closed Lost': 0
        };

        const dealData = {
            stage: newStage,
            probability: probabilityMap[newStage] || 10
        };

        try {
            const response = await fetch(`/api/saas/deal/${dealId}/stage`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dealData)
            });

            if (response.ok) {
                await this.loadData();
                this.renderDeals();
                this.renderPipeline();
                this.updateDashboard();
            } else {
                alert('Error updating deal stage');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error updating deal stage');
        }
    }

    async deleteDeal(dealId) {
        if (!confirm('Are you sure you want to delete this deal?')) return;

        try {
            const response = await fetch(`/api/saas/deal/${dealId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadData();
                this.renderDeals();
                this.renderPipeline();
                this.updateDashboard();
                alert('Deal deleted successfully!');
            } else {
                alert('Error deleting deal');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error deleting deal');
        }
    }

    async addRevenue() {
        const revenueData = {
            amount: parseFloat(document.getElementById('revenueAmount').value),
            source: document.getElementById('revenueSource').value,
            clientName: document.getElementById('revenueClientName').value,
            service: document.getElementById('revenueService').value,
            date: document.getElementById('revenueDate').value,
            notes: document.getElementById('revenueNotes').value
        };

        if (!revenueData.amount || !revenueData.source) {
            alert('Amount and source are required');
            return;
        }

        try {
            const response = await fetch('/api/saas/revenue/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(revenueData)
            });

            if (response.ok) {
                this.clearRevenueForm();
                await this.loadData();
                this.renderRevenue();
                this.updateDashboard();
                alert('Revenue recorded successfully!');
            } else {
                alert('Error recording revenue');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error recording revenue');
        }
    }

    async addGoal() {
        const goalData = {
            type: document.getElementById('goalType').value,
            target: parseFloat(document.getElementById('goalTarget').value),
            current: parseFloat(document.getElementById('goalCurrent').value) || 0,
            month: parseInt(document.getElementById('goalMonth').value),
            year: parseInt(document.getElementById('goalYear').value),
            description: document.getElementById('goalDescription').value
        };

        if (!goalData.type || !goalData.target) {
            alert('Goal type and target are required');
            return;
        }

        try {
            const response = await fetch('/api/saas/goal/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalData)
            });

            if (response.ok) {
                this.clearGoalForm();
                await this.loadData();
                this.renderGoals();
                this.updateDashboard();
                alert('Goal set successfully!');
            } else {
                alert('Error setting goal');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error setting goal');
        }
    }

    async addSubscription() {
        const subData = {
            clientName: document.getElementById('subClientName').value,
            service: document.getElementById('subService').value,
            monthlyAmount: parseFloat(document.getElementById('subMonthlyAmount').value),
            billingCycle: document.getElementById('subBillingCycle').value,
            startDate: document.getElementById('subStartDate').value,
            status: document.getElementById('subStatus').value
        };

        if (!subData.clientName || !subData.service || !subData.monthlyAmount) {
            alert('Client name, service, and amount are required');
            return;
        }

        try {
            const response = await fetch('/api/saas/subscription/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subData)
            });

            if (response.ok) {
                this.clearSubscriptionForm();
                await this.loadData();
                this.renderSubscriptions();
                this.updateDashboard();
                alert('Subscription added successfully!');
            } else {
                alert('Error adding subscription');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error adding subscription');
        }
    }

    async addExpense() {
        const expenseData = {
            category: document.getElementById('expenseCategory').value,
            description: document.getElementById('expenseDescription').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            date: document.getElementById('expenseDate').value,
            vendor: document.getElementById('expenseVendor').value
        };

        if (!expenseData.category || !expenseData.amount) {
            alert('Category and amount are required');
            return;
        }

        try {
            const response = await fetch('/api/saas/expense/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData)
            });

            if (response.ok) {
                this.clearExpenseForm();
                await this.loadData();
                this.renderExpenses();
                this.updateDashboard();
                alert('Expense recorded successfully!');
            } else {
                alert('Error recording expense');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error recording expense');
        }
    }


    // Rendering functions
    renderLeads() {
        const table = document.getElementById('leads-table');
        table.innerHTML = '';

        this.data.leads.forEach(lead => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="cursor: pointer; color: var(--accent-blue);" onclick="saasManager.showLeadDetails(${lead.id})">${lead.name}</td>
                <td>${lead.company || '-'}</td>
                <td>${lead.email}</td>
                <td>${lead.phone || '-'}</td>
                <td><span class="status-badge status-${lead.status?.toLowerCase().replace(' ', '-')}">${lead.status}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${lead.score || 0}</span>
                        <div style="width: 30px; height: 6px; background: #0f172a; border-radius: 3px;">
                            <div style="width: ${Math.min((lead.score || 0), 100)}%; height: 100%; background: ${lead.score >= 70 ? 'var(--accent-green)' : lead.score >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)'}; border-radius: 3px;"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <button class="btn" style="padding: 4px 8px; font-size: 12px; margin-right: 3px;" onclick="saasManager.convertLead(${lead.id})">Convert</button>
                    <button class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;" onclick="saasManager.deleteLead(${lead.id})">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    }

    // Show lead details in right panel
    async showLeadDetails(leadId) {
        try {
            const response = await fetch(`/api/saas/lead/${leadId}/history`);
            if (response.ok) {
                const data = await response.json();
                this.displayLeadDetails(data);
            }
        } catch (error) {
            console.error('Error loading lead details:', error);
        }
    }


    displayLeadDetails(data) {
        const content = document.getElementById('lead-details-content');
        const lead = data.lead;
        const activities = data.activities || [];
        const history = data.conversationHistory || [];

        // Get company and service info from lead
        const company = lead.company || 'Not specified';
        const service = lead.service || 'Not specified';
        const source = lead.source || 'Not specified';

        let activitiesHtml = '';
        if (activities.length > 0) {
            activitiesHtml = activities
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date desc
                .map(activity => `
                <div style="background: #0f172a; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid ${this.getActivityColor(activity.type)};">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <div style="font-weight: bold; color: ${this.getActivityColor(activity.type)}; text-transform: capitalize; font-size: 13px;">
                            ${this.getActivityIcon(activity.type)} ${activity.type}
                        </div>
                        <div style="font-size: 10px; color: #6b7280;">${this.formatRelativeTime(activity.date)}</div>
                    </div>
                    <div style="font-size: 14px; margin: 4px 0; color: var(--text-main);">${this.escapeHtml(activity.description)}</div>
                    ${activity.notes ? `<div style="font-size: 12px; color: #6b7280; font-style: italic; margin-top: 4px; background: rgba(139, 92, 246, 0.1); padding: 4px 8px; border-radius: 4px;">Note: ${this.escapeHtml(activity.notes)}</div>` : ''}
                    <div style="font-size: 10px; color: #6b7280; margin-top: 6px; display: flex; justify-content: space-between;">
                        <span>${activity.user}</span>
                        <span>${new Date(activity.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            `).join('');
        }

        content.innerHTML = `
            <div style="margin-bottom: 20px;">
                <!-- Lead Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                    <div>
                        <h3 style="color: var(--accent-blue); margin: 0 0 8px 0; font-size: 18px;">${this.escapeHtml(lead.name)}</h3>
                        <div style="font-size: 14px; color: #94a3b8;">${this.escapeHtml(company)}</div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                            <span style="margin-right: 12px;">📅 Created: ${new Date(lead.createdAt).toLocaleDateString('en-IN')}</span>
                            <span>🎯 Service: ${this.escapeHtml(service)}</span>
                        </div>
                    </div>
                    <div style="text-align: right; min-width: 120px;">
                        <select id="lead-status-select" onchange="saasManager.updateLeadStatus(${lead.id})" style="width: 100%; padding: 6px 8px; background: #0f172a; border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px; font-size: 11px; margin-bottom: 8px;">
                            <option value="New" ${lead.status === 'New' ? 'selected' : ''}>New</option>
                            <option value="Qualified" ${lead.status === 'Qualified' ? 'selected' : ''}>Qualified</option>
                            <option value="Contacted" ${lead.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                            <option value="Proposal" ${lead.status === 'Proposal' ? 'selected' : ''}>Proposal</option>
                            <option value="Negotiation" ${lead.status === 'Negotiation' ? 'selected' : ''}>Negotiation</option>
                            <option value="Converted" ${lead.status === 'Converted' ? 'selected' : ''}>Converted</option>
                        </select>
                        <button class="btn btn-success" style="padding: 6px 10px; font-size: 11px; width: 100%;" onclick="saasManager.convertLead(${lead.id})">💰 Convert</button>
                    </div>
                </div>
                

                <!-- Lead Information Grid -->
                <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border-color);">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">📧 Email</div>
                            <div style="font-weight: 500; word-break: break-all;">${this.escapeHtml(lead.email)}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">📱 Phone</div>
                            <div style="font-weight: 500;">${lead.phone ? this.formatPhoneNumber(lead.phone) : '<span style="color: #6b7280;">Not provided</span>'}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">🏢 Company</div>
                            <div style="font-weight: 500;">${this.escapeHtml(company)}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">🎯 Service</div>
                            <div style="font-weight: 500;">${this.escapeHtml(service)}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">📢 Source</div>
                            <div style="font-weight: 500;">${this.escapeHtml(source)}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">⭐ Score</div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-weight: 500; min-width: 25px;">${this.formatNumber(lead.score || 0)}</span>
                                <div style="flex: 1; height: 8px; background: #1e293b; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${Math.min((lead.score || 0), 100)}%; height: 100%; background: ${this.getScoreColor(lead.score || 0)}; border-radius: 4px; transition: width 0.3s;"></div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">👤 Status</div>
                            <div><span class="status-badge status-${lead.status?.toLowerCase().replace(' ', '-')}">${lead.status}</span></div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">📞 Last Contact</div>
                            <div style="font-weight: 500;">${lead.lastContact ? this.formatRelativeTime(lead.lastContact) : '<span style="color: #6b7280;">Never</span>'}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">⏰ Next Follow-up</div>
                            <div style="font-weight: 500;">${lead.nextFollowUp ? this.formatRelativeTime(lead.nextFollowUp) : '<span style="color: #6b7280;">Not scheduled</span>'}</div>
                        </div>
                        <div>
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">👨‍💼 Assigned To</div>
                            <div style="font-weight: 500;">${lead.assignedTo || '<span style="color: #6b7280;">Unassigned</span>'}</div>
                        </div>
                    </div>
                    ${lead.notes ? `
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
                            <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">📝 Notes</div>
                            <div style="font-size: 13px; color: var(--text-main); background: rgba(59, 130, 246, 0.1); padding: 8px; border-radius: 4px;">${this.escapeHtml(lead.notes)}</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Quick Actions -->
            <div style="background: var(--card-bg); padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid var(--border-color);">
                <h4 style="margin: 0 0 15px 0; color: var(--accent-blue); font-size: 14px;">⚡ Quick Actions</h4>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
                    <button class="btn" style="padding: 8px 12px; font-size: 11px; background: var(--accent-green);" onclick="saasManager.addActivity(${lead.id}, 'call')">📞 Log Call</button>
                    <button class="btn" style="padding: 8px 12px; font-size: 11px; background: var(--accent-blue);" onclick="saasManager.addActivity(${lead.id}, 'email')">✉️ Log Email</button>
                    <button class="btn" style="padding: 8px 12px; font-size: 11px; background: var(--accent-orange);" onclick="saasManager.addActivity(${lead.id}, 'sms')">📱 Log SMS</button>
                    <button class="btn" style="padding: 8px 12px; font-size: 11px; background: var(--accent-purple);" onclick="saasManager.addActivity(${lead.id}, 'note')">📝 Add Note</button>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                    <div>
                        <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 5px;">📅 Follow-up Date</label>
                        <input type="date" id="followup-date" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px; font-size: 12px;">
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #6b7280; display: block; margin-bottom: 5px;">🔥 Priority</label>
                        <select id="followup-priority" style="width: 100%; padding: 8px; background: #0f172a; border: 1px solid var(--border-color); color: var(--text-main); border-radius: 4px; font-size: 12px;">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                
                <button class="btn btn-success" style="padding: 8px 16px; margin-top: 5px; width: 100%; font-size: 12px;" onclick="saasManager.setFollowUp(${lead.id})">⏰ Schedule Follow-up</button>
            </div>

            <!-- Activity Timeline -->
            <div style="background: var(--card-bg); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin: 0; color: var(--accent-blue); font-size: 14px;">📊 Activity Timeline</h4>
                    <span style="font-size: 11px; color: #6b7280; background: rgba(59, 130, 246, 0.1); padding: 2px 8px; border-radius: 10px;">${activities.length} activities</span>
                </div>
                <div style="max-height: 300px; overflow-y: auto; padding-right: 5px;">
                    ${activitiesHtml || `
                        <div style="text-align: center; color: #6b7280; padding: 40px 20px;">
                            <div style="font-size: 32px; margin-bottom: 10px;">📝</div>
                            <p style="margin: 0 0 5px 0; font-size: 14px;">No activities recorded yet</p>
                            <p style="margin: 0; font-size: 12px;">Start logging calls, emails, and notes to track progress</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    // Add activity (call, email, sms, note)
    async addActivity(leadId, type) {
        const descriptions = {
            'call': 'Phone call made',
            'email': 'Email sent',
            'sms': 'SMS sent',
            'note': 'Note added'
        };

        const description = prompt(`Enter ${type} description:`, descriptions[type]);
        if (!description) return;

        const notes = prompt('Additional notes (optional):', '');

        try {
            const response = await fetch(`/api/saas/lead/${leadId}/activity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: type,
                    description: description,
                    notes: notes
                })
            });

            if (response.ok) {
                await this.loadData();
                this.showLeadDetails(leadId);
                this.renderLeads();
                alert(`${type} activity logged successfully!`);
            } else {
                alert('Error logging activity');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error logging activity');
        }
    }

    // Update lead status
    async updateLeadStatus(leadId) {
        const statusSelect = document.getElementById('lead-status-select');
        const newStatus = statusSelect.value;
        const notes = prompt('Status change notes (optional):', '');

        try {
            const response = await fetch(`/api/saas/lead/${leadId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: newStatus,
                    notes: notes
                })
            });

            if (response.ok) {
                await this.loadData();
                this.showLeadDetails(leadId);
                this.renderLeads();
                this.updateDashboard();
                alert('Status updated successfully!');
            } else {
                alert('Error updating status');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error updating status');
        }
    }

    // Set follow-up
    async setFollowUp(leadId) {
        const followUpDate = document.getElementById('followup-date').value;
        const priority = document.getElementById('followup-priority').value;
        const followUpNotes = prompt('Follow-up notes (optional):', '');

        if (!followUpDate) {
            alert('Please select a follow-up date');
            return;
        }

        try {
            const response = await fetch(`/api/saas/lead/${leadId}/followup`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    followUpDate: followUpDate,
                    followUpNotes: followUpNotes,
                    priority: priority
                })
            });

            if (response.ok) {
                await this.loadData();
                this.showLeadDetails(leadId);
                this.renderLeads();
                this.updateDashboard();
                alert('Follow-up scheduled successfully!');
            } else {
                alert('Error scheduling follow-up');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error scheduling follow-up');
        }
    }

    renderDeals() {
        const table = document.getElementById('deals-table');
        table.innerHTML = '';

        this.data.deals.forEach(deal => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${deal.clientName}</td>
                <td>${deal.company || '-'}</td>
                <td>₹${deal.value?.toLocaleString()}</td>
                <td><span class="status-badge status-${deal.stage?.toLowerCase().replace(' ', '-')}">${deal.stage}</span></td>
                <td>${deal.probability}%</td>
                <td>${deal.expectedCloseDate || '-'}</td>
                <td>
                    <select onchange="saasManager.updateDealStage(${deal.id}, this.value)" style="margin-right: 5px;">
                        <option value="Prospecting" ${deal.stage === 'Prospecting' ? 'selected' : ''}>Prospecting</option>
                        <option value="Qualified" ${deal.stage === 'Qualified' ? 'selected' : ''}>Qualified</option>
                        <option value="Proposal" ${deal.stage === 'Proposal' ? 'selected' : ''}>Proposal</option>
                        <option value="Negotiation" ${deal.stage === 'Negotiation' ? 'selected' : ''}>Negotiation</option>
                        <option value="Closed Won" ${deal.stage === 'Closed Won' ? 'selected' : ''}>Closed Won</option>
                        <option value="Closed Lost" ${deal.stage === 'Closed Lost' ? 'selected' : ''}>Closed Lost</option>
                    </select>
                    <button class="btn btn-danger" style="padding: 6px 12px;" onclick="saasManager.deleteDeal(${deal.id})">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    }

    renderPipeline() {
        const stages = ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
        const container = document.getElementById('pipeline-stages');
        container.innerHTML = '';

        stages.forEach(stage => {
            const stageDeals = this.data.deals.filter(deal => deal.stage === stage);
            const stageValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

            const stageDiv = document.createElement('div');
            stageDiv.className = 'pipeline-stage';
            stageDiv.innerHTML = `
                <div class="stage-title">${stage}</div>
                <div style="font-size: 14px; color: var(--accent-green); margin-bottom: 12px;">
                    ₹${stageValue.toLocaleString()}
                </div>
            `;

            stageDeals.forEach(deal => {
                const dealDiv = document.createElement('div');
                dealDiv.className = 'deal-card';
                dealDiv.innerHTML = `
                    <div class="deal-client">${deal.clientName}</div>
                    <div class="deal-value">₹${deal.value?.toLocaleString()}</div>
                    <div style="font-size: 12px; color: #6b7280;">${deal.service || 'General'}</div>
                `;
                stageDiv.appendChild(dealDiv);
            });

            container.appendChild(stageDiv);
        });
    }

    renderRevenue() {
        const table = document.getElementById('revenue-table');
        table.innerHTML = '';

        this.data.revenue.forEach(revenue => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${revenue.date}</td>
                <td>${revenue.source}</td>
                <td>${revenue.clientName || '-'}</td>
                <td>${revenue.service || '-'}</td>
                <td>₹${revenue.amount?.toLocaleString()}</td>
                <td>
                    <button class="btn btn-danger" style="padding: 6px 12px;" onclick="saasManager.deleteRevenue(${revenue.id})">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    }

    renderGoals() {
        const table = document.getElementById('goals-table');
        table.innerHTML = '';

        this.data.goals.forEach(goal => {
            const progress = goal.target > 0 ? ((goal.current / goal.target) * 100).toFixed(1) : 0;
            const achieved = goal.current >= goal.target;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${goal.type}</td>
                <td>₹${goal.target?.toLocaleString()}</td>
                <td>₹${goal.current?.toLocaleString()}</td>
                <td>
                    <div style="background: #0f172a; border-radius: 4px; height: 8px; margin: 4px 0;">
                        <div style="background: ${achieved ? 'var(--accent-green)' : 'var(--accent-blue)'}; height: 100%; width: ${Math.min(progress, 100)}%; border-radius: 4px;"></div>
                    </div>
                    ${progress}%
                </td>
                <td>${goal.month}/${goal.year}</td>
                <td><span class="status-badge ${achieved ? 'status-converted' : 'status-new'}">${achieved ? 'Achieved' : 'In Progress'}</span></td>
                <td>
                    <button class="btn btn-danger" style="padding: 6px 12px;" onclick="saasManager.deleteGoal(${goal.id})">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    }

    renderSubscriptions() {
        const table = document.getElementById('subscriptions-table');
        table.innerHTML = '';

        this.data.subscriptions.forEach(sub => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sub.clientName}</td>
                <td>${sub.service}</td>
                <td>₹${sub.monthlyAmount?.toLocaleString()}</td>
                <td><span class="status-badge ${sub.status === 'Active' ? 'status-converted' : 'status-new'}">${sub.status}</span></td>
                <td>${sub.nextBilling || '-'}</td>
                <td>
                    <button class="btn btn-danger" style="padding: 6px 12px;" onclick="saasManager.deleteSubscription(${sub.id})">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    }

    renderExpenses() {
        const table = document.getElementById('expenses-table');
        table.innerHTML = '';

        this.data.expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.date}</td>
                <td>${expense.category}</td>
                <td>${expense.description}</td>
                <td>₹${expense.amount?.toLocaleString()}</td>
                <td>${expense.vendor || '-'}</td>
                <td>
                    <button class="btn btn-danger" style="padding: 6px 12px;" onclick="saasManager.deleteExpense(${expense.id})">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    }

    // Form clearing functions
    clearLeadForm() {
        document.getElementById('leadName').value = '';
        document.getElementById('leadEmail').value = '';
        document.getElementById('leadPhone').value = '';
        document.getElementById('leadCompany').value = '';
        document.getElementById('leadSource').value = 'Website';
        document.getElementById('leadService').value = 'Web Development';
        document.getElementById('leadScore').value = '50';
        document.getElementById('leadNotes').value = '';
    }

    clearDealForm() {
        document.getElementById('dealClientName').value = '';
        document.getElementById('dealClientEmail').value = '';
        document.getElementById('dealCompany').value = '';
        document.getElementById('dealValue').value = '';
        document.getElementById('dealService').value = 'Web Development';
        document.getElementById('dealStage').value = 'Prospecting';
        document.getElementById('dealProbability').value = '10';
        document.getElementById('dealCloseDate').value = '';
        document.getElementById('dealNotes').value = '';
    }

    clearRevenueForm() {
        document.getElementById('revenueAmount').value = '';
        document.getElementById('revenueSource').value = 'Subscription';
        document.getElementById('revenueClientName').value = '';
        document.getElementById('revenueService').value = '';
        document.getElementById('revenueDate').value = '';
        document.getElementById('revenueNotes').value = '';
    }

    clearGoalForm() {
        document.getElementById('goalType').value = 'Monthly Revenue';
        document.getElementById('goalTarget').value = '';
        document.getElementById('goalCurrent').value = '';
        document.getElementById('goalMonth').value = new Date().getMonth() + 1;
        document.getElementById('goalYear').value = new Date().getFullYear();
        document.getElementById('goalDescription').value = '';
    }

    clearSubscriptionForm() {
        document.getElementById('subClientName').value = '';
        document.getElementById('subService').value = '';
        document.getElementById('subMonthlyAmount').value = '';
        document.getElementById('subBillingCycle').value = 'Monthly';
        document.getElementById('subStartDate').value = '';
        document.getElementById('subStatus').value = 'Active';
    }

    clearExpenseForm() {
        document.getElementById('expenseCategory').value = 'Marketing';
        document.getElementById('expenseDescription').value = '';
        document.getElementById('expenseAmount').value = '';
        document.getElementById('expenseDate').value = '';
        document.getElementById('expenseVendor').value = '';
    }

    // Delete functions for revenue, goals, subscriptions, and expenses
    async deleteRevenue(id) {
        if (!confirm('Are you sure you want to delete this revenue record?')) return;
        // Add delete implementation when API is available
        alert('Delete functionality for revenue will be implemented');
    }

    async deleteGoal(id) {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        // Add delete implementation when API is available
        alert('Delete functionality for goals will be implemented');
    }

    async deleteSubscription(id) {
        if (!confirm('Are you sure you want to delete this subscription?')) return;
        // Add delete implementation when API is available
        alert('Delete functionality for subscriptions will be implemented');
    }


    async deleteExpense(id) {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        // Add delete implementation when API is available
        alert('Delete functionality for expenses will be implemented');
    }

    // Import leads from CSV
    async importLeads() {
        const csvData = document.getElementById('csvData').value.trim();
        if (!csvData) {
            alert('Please paste CSV data');
            return;
        }

        try {
            // Parse CSV data
            const lines = csvData.split('\n');
            if (lines.length < 2) {
                alert('CSV must have at least one data row');
                return;
            }

            // Parse headers
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            // Expected headers mapping
            const headerMap = {
                'name': 'name',
                'email': 'email',
                'phone': 'phone',
                'company': 'company',
                'source': 'source',
                'service': 'service',
                'notes': 'notes',
                'score': 'score'
            };

            const leads = [];
            
            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                if (values.length < 2) continue; // Skip empty lines
                
                const lead = {};
                
                headers.forEach((header, index) => {
                    const mappedKey = headerMap[header];
                    if (mappedKey && values[index]) {
                        lead[mappedKey] = values[index].trim();
                    }
                });

                if (lead.name && lead.email) {
                    leads.push(lead);
                }
            }

            if (leads.length === 0) {
                alert('No valid leads found in CSV data');
                return;
            }

            // Send to API
            const response = await fetch('/api/saas/lead/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leads })
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Successfully imported ${result.imported} leads!${result.errors.length > 0 ? `\nErrors: ${result.errors.join(', ')}` : ''}`);
                document.getElementById('csvData').value = '';
                await this.loadData();
                this.renderLeads();
                this.updateDashboard();
            } else {
                alert('Error importing leads');
            }
        } catch (error) {
            console.error('Error importing leads:', error);
            alert('Error importing leads');
        }
    }

    // Check subscription billing
    async checkSubscriptionBilling() {
        try {
            const response = await fetch('/api/saas/subscription/check-billing');
            if (response.ok) {
                const result = await response.json();
                
                const billingStatusDiv = document.getElementById('billing-status');
                const billingResultsDiv = document.getElementById('billing-results');
                
                if (result.dueSubscriptions > 0) {
                    billingResultsDiv.innerHTML = `
                        <div style="background: rgba(245, 158, 11, 0.2); padding: 16px; border-radius: 8px; border: 1px solid var(--accent-orange);">
                            <h4 style="color: var(--accent-orange); margin: 0 0 10px 0;">⚠️ ${result.dueSubscriptions} Subscriptions Due for Billing</h4>
                            <p style="margin: 5px 0;">Total Revenue: ₹${result.revenue.toLocaleString()}</p>
                            <p style="margin: 5px 0; font-size: 12px;">Revenue records have been created and are pending confirmation.</p>
                        </div>
                    `;
                } else {
                    billingResultsDiv.innerHTML = `
                        <div style="background: rgba(16, 185, 129, 0.2); padding: 16px; border-radius: 8px; border: 1px solid var(--accent-green);">
                            <h4 style="color: var(--accent-green); margin: 0 0 10px 0;">✅ No Subscriptions Due Today</h4>
                            <p style="margin: 5px 0;">All subscriptions are up to date!</p>
                        </div>
                    `;
                }
                
                billingStatusDiv.style.display = 'block';
                
                // Refresh data to show new revenue records
                await this.loadData();
                this.renderRevenue();
                this.updateDashboard();
                
            } else {
                alert('Error checking subscription billing');
            }
        } catch (error) {
            console.error('Error checking billing:', error);
            alert('Error checking subscription billing');
        }
    }

    // Show billing history
    showBillingHistory() {
        const billingStatusDiv = document.getElementById('billing-status');
        const billingResultsDiv = document.getElementById('billing-results');
        
        if (this.data.subscriptions.length === 0) {
            billingResultsDiv.innerHTML = '<p>No subscriptions found.</p>';
            billingStatusDiv.style.display = 'block';
            return;
        }
        
        let historyHtml = '<h4 style="margin: 0 0 15px 0;">Subscription Billing History</h4>';
        
        this.data.subscriptions.forEach(sub => {
            if (sub.billingHistory && sub.billingHistory.length > 0) {
                historyHtml += `
                    <div style="background: var(--card-bg); padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                        <strong>${sub.clientName}</strong> - ${sub.service} (₹${sub.monthlyAmount.toLocaleString()}/month)<br>
                        <small style="color: #6b7280;">
                            Billing History (${sub.billingHistory.length} records):
                `;
                
                sub.billingHistory.slice(-3).forEach(bill => {
                    historyHtml += ` ${bill.date}: ₹${bill.amount.toLocaleString()} (${bill.status})`;
                });
                
                historyHtml += '</small></div>';
            }
        });
        
        billingResultsDiv.innerHTML = historyHtml;
        billingStatusDiv.style.display = 'block';
    }
}

// Tab switching function
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked nav tab
    event.target.classList.add('active');

    // Refresh data when switching to dashboard
    if (tabName === 'dashboard') {
        saasManager.loadStats().then(() => {
            saasManager.updateDashboard();
        });
    }
}


// Import leads from CSV textarea
async function importLeadsFromTextarea() {
    const csvData = document.getElementById('csvImportData').value.trim();
    if (!csvData) {
        alert('Please paste CSV data in the textarea');
        return;
    }

    try {
        // Parse CSV data
        const lines = csvData.split('\n');
        if (lines.length < 2) {
            alert('CSV must have at least one data row');
            return;
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Expected headers mapping
        const headerMap = {
            'name': 'name',
            'email': 'email',
            'phone': 'phone',
            'company': 'company',
            'source': 'source',
            'service': 'service',
            'notes': 'notes',
            'score': 'score'
        };

        const leads = [];
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(',');
            if (values.length < 2) continue; // Skip lines with insufficient data
            
            const lead = {};
            
            headers.forEach((header, index) => {
                const mappedKey = headerMap[header];
                if (mappedKey && values[index]) {
                    lead[mappedKey] = values[index].trim();
                }
            });

            if (lead.name && lead.email) {
                leads.push(lead);
            }
        }

        if (leads.length === 0) {
            alert('No valid leads found in CSV data');
            return;
        }

        // Send to API
        const response = await fetch('/api/saas/lead/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads })
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Successfully imported ${result.imported} leads!${result.errors.length > 0 ? `\nErrors: ${result.errors.join(', ')}` : ''}`);
            document.getElementById('csvImportData').value = '';
            await saasManager.loadData();
            saasManager.renderLeads();
            saasManager.updateDashboard();
        } else {
            alert('Error importing leads');
        }
    } catch (error) {
        console.error('Error importing leads:', error);
        alert('Error importing leads');
    }
}


// Global functions for button clicks
async function addLead() {
    await saasManager.addLead();
}

async function addDeal() {
    await saasManager.addDeal();
}

async function addRevenue() {
    await saasManager.addRevenue();
}

async function addGoal() {
    await saasManager.addGoal();
}

async function addSubscription() {
    await saasManager.addSubscription();
}

async function addExpense() {
    await saasManager.addExpense();
}


// Billing management functions
async function checkSubscriptionBilling() {
    await saasManager.checkSubscriptionBilling();
}

function showBillingHistory() {
    saasManager.showBillingHistory();
}

// Initialize the SaaS Manager when page loads
let saasManager;
document.addEventListener('DOMContentLoaded', () => {
    saasManager = new SaaSManager();
});
