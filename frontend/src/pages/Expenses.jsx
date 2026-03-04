{/*import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Wallet, ArrowLeft, Pencil, Trash2, Filter } from 'lucide-react';
import DownloadCSV from '../components/DownloadCSV';

const CATEGORIES = [
  'All',
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Bills',
  'Rent',
  'Others'
];

export default function Expenses({ user, onLogout }) {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editData, setEditData] = useState({
    amount: '',
    category: '',
    description: '',
    date: ''
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data);
      setFilteredExpenses(response.data);
    } catch (error) {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

 
  useEffect(() => {
  let filtered = expenses;

  // Category Filter
  if (selectedCategory !== 'All') {
    filtered = filtered.filter(exp => exp.category === selectedCategory);
  }

  // Start Date Filter
  if (startDate) {
    filtered = filtered.filter(exp => exp.date >= startDate);
  }

  // End Date Filter
  if (endDate) {
    filtered = filtered.filter(exp => exp.date <= endDate);
  }

  setFilteredExpenses(filtered);
}, [selectedCategory, startDate, endDate, expenses]);

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setEditData({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description,
      date: expense.date
    });
    setEditDialog(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/expenses/${selectedExpense.id}`, {
        ...editData,
        amount: parseFloat(editData.amount)
      });
      toast.success('Expense updated successfully!');
      setEditDialog(false);
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to update expense');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${selectedExpense.id}`);
      toast.success('Expense deleted successfully!');
      setDeleteDialog(false);
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>ExpenseZen</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              data-testid="back-to-dashboard-button"
              className="hover:bg-primary/10 hover:text-primary "
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h2 className="text-4xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>All Expenses</h2>
            </div>
          </div>
        
          <div className="flex items-end justify-end gap-6 w-full">


  <div className="flex flex-col">
    <label className="text-xs font-medium text-muted-foreground mb-1">Category</label>
    <div className="flex items-center gap-2">
      <Filter className="h-5 w-5 text-muted-foreground" />
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>

  <div className="flex flex-col">
    <label className="text-xs font-medium text-muted-foreground mb-1">From</label>
    <Input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="w-[160px]"
    />
  </div>

  <div className="flex flex-col">
    <label className="text-xs font-medium text-muted-foreground mb-1">To</label>
    <Input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="w-[160px]"
    />
  </div>



</div>
        </div>

        <Card className="shadow-sm rounded-xl border-border mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Export Expenses</h3>
                <p className="text-sm text-muted-foreground">Download your expenses as CSV</p>
              </div>
              <DownloadCSV variant="default" />
            </div>
          </CardContent>
        </Card>


        <Card className="shadow-sm rounded-xl border-border">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>
              {filteredExpenses.length} Expense{filteredExpenses.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length > 0 ? (
              <div className="space-y-3">
                {filteredExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    data-testid="expense-item"
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-medium text-lg">{expense.description}</p>
                        <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                          {expense.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        ₹{expense.amount.toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          data-testid={`edit-expense-₹{expense.id}`}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setDeleteDialog(true);
                          }}
                          data-testid={`delete-expense-₹{expense.id}`}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No expenses found for the selected category.
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent data-testid="edit-expense-dialog">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update the details of your expense</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  data-testid="edit-expense-amount-input"
                  type="number"
                  step="0.01"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={editData.category}
                  onValueChange={(value) => setEditData({ ...editData, category: value })}
                >
                  <SelectTrigger data-testid="edit-expense-category-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(cat => cat !== 'All').map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  data-testid="edit-expense-description-input"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  data-testid="edit-expense-date-input"
                  type="date"
                  value={editData.date}
                  onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" data-testid="edit-expense-submit-button" className="bg-primary hover:bg-primary/90">
                Update Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent data-testid="delete-expense-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete-button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="confirm-delete-button"
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
*/}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, Plus, TrendingUp, DollarSign, List, LogOut,IndianRupee } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import DownloadCSV from '../components/DownloadCSV';
import { Months } from 'react-day-picker';

const CATEGORIES = [
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Bills',
  'Rent' ,
  'Others'
];

const COLORS = ['#2F5E41', '#D97706', '#E8F3E8', '#78716C', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const monthlyTotals = recentExpenses.reduce((acc, expense) => {
  const month = new Date(expense.date).toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  acc[month] = (acc[month] || 0) + expense.amount;
  return acc;
}, {});

  const fetchData = async () => {
    try {
      const [analyticsRes, expensesRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/expenses')
      ]);
      setAnalytics(analyticsRes.data);
      //setRecentExpenses(expensesRes.data.slice(0, 5));//i ahve change this line of code 
      setRecentExpenses(expensesRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  //Function to handel to show the data of the expenses in the form of the pie chart and bar chart
  const currentMonth = new Date().toISOString().slice(0, 7); // "2025-02"

const monthlyCategoryMap = recentExpenses.reduce((acc, exp) => {
  if (exp.date.startsWith(currentMonth)) {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
  }
  return acc;
}, {});

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...expenseData,
        amount: parseFloat(expenseData.amount)
      });
      toast.success('Expense added successfully!');
      setDialogOpen(false);
      setExpenseData({
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to add expense');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }


 const pieData = Object.keys(monthlyCategoryMap).map((cat, idx) => ({
  name: cat,
  value: monthlyCategoryMap[cat],
  color: COLORS[idx % COLORS.length]
}));

//function for the total expenses of the month in new function
//const currentMonth = new Date().toISOString().slice(0, 7);

// Filter expenses of the current month
const monthlyExpenses = recentExpenses.filter(exp =>
  exp.date.startsWith(currentMonth)
);

// Total spent this month
const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);

// Total transactions this month
const monthlyCount = monthlyExpenses.length;

// Categories used this month
const monthlyCategories = new Set(
  monthlyExpenses.map(exp => exp.category)
).size;

 {/* return (
    <div className="min-h-screen bg-background">
      <header className="bg-white/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>ExpenseZen</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Hello, {user?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              data-testid="logout-button"
              className="hover:bg-muted"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Dashboard</h2>
            <p className="text-muted-foreground">Welcome back! Here's your expense overview</p>
          </div>
          <div className="flex gap-3 coloumn">
            <Button
              variant="outline"
              onClick={() => navigate('/expenses')}
              data-testid="view-all-expenses-button"
              className="h-11 rounded-lg"
            >
              <List className="h-4 w-4 mr-2" />
              View All Expenses
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="add-expense-button"
                  className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="add-expense-dialog">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>Enter the details of your expense</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddExpense}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        data-testid="expense-amount-input"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={expenseData.amount}
                        onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={expenseData.category}
                        onValueChange={(value) => setExpenseData({ ...expenseData, category: value })}
                      >
                        <SelectTrigger data-testid="expense-category-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        data-testid="expense-description-input"
                        placeholder="What was this expense for?"
                        value={expenseData.description}
                        onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        data-testid="expense-date-input"
                        type="date"
                        value={expenseData.date}
                        onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" data-testid="expense-submit-button" className="bg-primary hover:bg-primary/90">
                      Add Expense
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-border hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="total-expenses" style={{ fontFamily: 'Manrope, sans-serif' }}>
             
              ₹{monthlyTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-border hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="transaction-count" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {monthlyCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total recorded</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-300 rounded-xl border-border hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="category-count" style={{ fontFamily: 'Manrope, sans-serif' }}>
                {monthlyCategories}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active categories</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm rounded-xl border-border mb-8">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Export Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">Download your expenses as CSV for any month</p>
              <DownloadCSV variant="outline" />
            </div>
          </CardContent>
        </Card>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-sm rounded-xl border-border">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No expenses yet. Add your first expense!
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-xl border-border">
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.monthly_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthly_trend}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#2F5E41" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No expense trends to show yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm rounded-xl border-border">
          <CardHeader>
            <CardTitle style={{ fontFamily: 'Manrope, sans-serif' }}>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    data-testid="recent-expense-item"
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors duration-200"
                  >
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {expense.category} • {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-lg font-semibold">₹{expense.amount.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No expenses recorded yet. Start by adding your first expense!
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );*/}

  return (
  <div className="min-h-screen bg-background">
    {/* Header: Adjusted for mobile padding and flex wrap */}
    <header className="bg-white/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-primary p-1.5 sm:p-2 rounded-lg shrink-0">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>
            ExpenseZen
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="hidden xs:block text-xs sm:text-sm text-muted-foreground truncate max-w-[100px]">
            {user?.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-9 px-2 sm:px-3 hover:bg-muted"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>

    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Title Section: Stacked on mobile */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-1" style={{ fontFamily: 'Manrope, sans-serif' }}>Dashboard</h2>
          <p className="text-sm text-muted-foreground">Welcome back, expense overview</p>
        </div>
        <div className="flex flex-row gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/expenses')}
            className="flex-1 md:flex-none h-10 rounded-lg text-xs sm:text-sm"
          >
            <List className="h-4 w-4 mr-2" />
            View All
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 md:flex-none h-10 bg-primary rounded-lg text-xs sm:text-sm shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            {/* ... DialogContent stays mostly the same ... */}
            <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-xl">
               {/* Your existing Form content */}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards: 1 column on mobile, 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Expenses" value={`₹${monthlyTotal.toFixed(2)}`} icon={<IndianRupee />} sub="This Month" />
        <StatCard title="Transactions" value={monthlyCount} icon={<TrendingUp />} sub="This Month" />
        <StatCard title="Categories" value={monthlyCategories} icon={<List />} sub="Active" />
      </div>

      {/* Export Card: Responsive flex */}
      <Card className="shadow-sm rounded-xl border-border mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold">Export Monthly Expenses</h3>
              <p className="text-xs text-muted-foreground">Download CSV for your records</p>
            </div>
            <DownloadCSV variant="outline" className="w-full sm:w-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Charts: 1 column on small/med, 2 on large */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] sm:h-[400px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyState /> }
          </CardContent>
        </Card>

        {/* Similar logic for Bar Chart Card */}
      </div>
      
      {/* Recent Expenses: Full width list */}
      <Card className="shadow-sm rounded-xl border-border">
        <CardHeader>
          <CardTitle className="text-lg">Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
           {/* Your list mapping here - use px-2 on mobile to save space */}
        </CardContent>
      </Card>
    </main>
  </div>
);

// Helper component to keep code clean
function StatCard({ title, value, icon, sub }) {
  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}
}
