const $ = (id) => document.getElementById(id);
const API_URL = 'https://btyutrnvwhclnpjqduat.supabase.co/functions/v1/wedding-guests-api';
const state = { role: 'Richard', sales: [], expenses: [], totals: {}, scope: 'employee' };
const money = (value) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
const notice = (text) => { $('notice').textContent = text; };

async function api(action, payload = {}) {
  const response = await fetch(API_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, actor: state.role, payload })
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || 'Server request failed.');
  return result;
}

async function loadState() {
  const result = await api('state');
  state.sales = result.sales || [];
  state.expenses = result.expenses || [];
  state.totals = result.totals || {};
  state.scope = result.scope || (state.role === 'Svetlana' ? 'manager' : 'employee');
  render();
}

const isSalesperson = () => ['Richard', 'Anastasia', 'Jean-Claude'].includes(state.role);
const isManager = () => state.role === 'Svetlana';

function saleRecord(s) {
  const pending = s.status !== 'Approved';
  const controls = isManager() && pending
    ? '<div class="actions"><button onclick="approveSale(\'' + s.reference + '\',' + s.proposed_r + ',' + s.proposed_a + ',' + s.proposed_j + ')">Approve proposed split</button><button class="secondary" onclick="correctSale(\'' + s.reference + '\',' + s.proposed_r + ',' + s.proposed_a + ',' + s.proposed_j + ')">Correct split</button></div>' : '';
  const final = s.status === 'Approved' ? '<div class="meta">Final commission: Richard ' + money(s.commission_r) + ' · Anastasia ' + money(s.commission_a) + ' · Jean-Claude ' + money(s.commission_j) + '</div>' : '';
  return '<div class="record"><div class="record-head"><span>' + s.reference + ' · ' + money(s.amount) + '</span><span class="tag ' + (pending ? 'warn' : '') + '">' + s.status + '</span></div><div class="meta">' + s.salesperson + ' · Project ' + s.project + ' · ' + s.customer + '</div><div class="meta">Proposed: R ' + s.proposed_r + '% / A ' + s.proposed_a + '% / J ' + s.proposed_j + '% · Sheet: ' + (s.sheet_status || 'Pending') + '</div>' + final + controls + '</div>';
}

function expenseRecord(e) {
  const pending = e.status === 'Awaiting allocation';
  const controls = isManager() && pending
    ? '<div class="actions"><button onclick="approveExpense(\'' + e.reference + '\',\'' + e.proposed_allocation + '\')">Confirm allocation</button><button class="secondary" onclick="correctExpense(\'' + e.reference + '\',\'' + e.proposed_allocation + '\')">Change allocation</button></div>' : '';
  const final = e.final_allocation ? '<div class="meta">Final allocation: ' + e.final_allocation + '</div>' : '';
  return '<div class="record"><div class="record-head"><span>' + e.reference + ' · ' + money(e.amount) + '</span><span class="tag ' + (pending ? 'warn' : '') + '">' + e.status + '</span></div><div class="meta">' + e.reporter + ' · ' + e.category + ' · Proposed: ' + e.proposed_allocation + '</div><div class="meta">' + e.description + ' · Sheet: ' + (e.sheet_status || 'Pending') + '</div>' + final + controls + '</div>';
}

function render() {
  const t = state.totals || {};
  if (state.scope === 'manager') {
    const metrics = [['Company result', t.company_result], ['Project A result', t.project_a_result], ['Project B result', t.project_b_result], ['Richard commission', t.richard_commission], ['Anastasia commission', t.anastasia_commission], ['Jean-Claude commission', t.jean_claude_commission]];
    $('metrics').innerHTML = metrics.map((x) => '<div class="metric"><span>' + x[0] + '</span><strong>' + money(x[1]) + '</strong></div>').join('');
    $('projects').innerHTML = '<div class="card project"><h2>Project A</h2><strong>Result: ' + money(t.project_a_result) + '</strong></div><div class="card project"><h2>Project B</h2><strong>Result: ' + money(t.project_b_result) + '</strong></div>';
  } else {
    $('metrics').innerHTML = '<div class="metric"><span>PRIVATE EMPLOYEE VIEW</span><strong>Your permitted records only</strong></div>';
    $('projects').innerHTML = '';
  }
  $('sales').innerHTML = state.sales.length ? state.sales.map(saleRecord).join('') : '<p class="meta">No permitted sales records.</p>';
  $('expenses').innerHTML = state.expenses.length ? state.expenses.map(expenseRecord).join('') : '<p class="meta">No permitted expense records.</p>';
  $('sale-form').querySelector('button').disabled = !isSalesperson();
  $('expense-form').querySelector('button').disabled = state.role !== 'Kevin';
}

window.approveSale = async (reference, richard, anastasia, jean) => {
  try { await api('approve_sale', { reference, richard, anastasia, jean }); notice(reference + ' approved.'); await loadState(); }
  catch (error) { notice('Server error: ' + error.message); }
};
window.correctSale = async (reference, r, a, j) => {
  const answer = prompt('Final split: Richard, Anastasia, Jean-Claude. Total must equal 100.', r + ',' + a + ',' + j);
  if (!answer) return;
  const values = answer.split(',').map(Number);
  if (values.some((n) => n < 0) || values[0] + values[1] + values[2] !== 100) return notice('Split must contain non-negative values and total 100.');
  await window.approveSale(reference, values[0], values[1], values[2]);
};
window.approveExpense = async (reference, allocation) => {
  try { await api('approve_expense', { reference, allocation }); notice(reference + ' allocated to ' + allocation + '.'); await loadState(); }
  catch (error) { notice('Server error: ' + error.message); }
};
window.correctExpense = async (reference, allocation) => {
  const value = prompt('Final allocation: A, B, or overhead.', allocation);
  if (!['A', 'B', 'overhead'].includes(value)) return notice('Use A, B, or overhead.');
  await window.approveExpense(reference, value);
};

$('role').addEventListener('change', async (event) => { state.role = event.target.value; notice('Role changed to ' + state.role + '.'); await loadState(); });
$('sale-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isSalesperson()) return notice('Only salespeople may submit sales.');
  const d = Object.fromEntries(new FormData(event.target));
  const richard = Number(d.richard), anastasia = Number(d.anastasia), jean = Number(d.jean);
  if (richard + anastasia + jean !== 100) return notice('Commission shares must total 100%.');
  try { await api('sale', { reference: d.reference, customer: d.customer, project: d.project, description: d.description, amount: Number(d.amount), richard, anastasia, jean, source: 'website' }); event.target.reset(); notice(d.reference + ' saved.'); await loadState(); }
  catch (error) { notice('Server error: ' + error.message); }
});
$('expense-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (state.role !== 'Kevin') return notice('Only Kevin may submit expenses.');
  const d = Object.fromEntries(new FormData(event.target));
  try { await api('expense', { reference: d.reference, description: d.description, category: d.category, amount: Number(d.amount), allocation: d.allocation, source: 'website' }); event.target.reset(); notice(d.reference + ' saved.'); await loadState(); }
  catch (error) { notice('Server error: ' + error.message); }
});
$('refresh').addEventListener('click', loadState);
$('load-tests').addEventListener('click', () => notice('Use the real forms to submit Test 1 and Test 2 data.'));
loadState().catch((error) => notice('Could not load backend data: ' + error.message));
