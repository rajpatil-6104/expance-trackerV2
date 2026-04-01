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
        {/*<div className="text-lg text-muted-foreground">Loading...</div>*/}
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
          <div className="flex gap-3">
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

        {/* CSV Download Section */}
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
  );
}
/*
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '../App';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Wallet, Plus, TrendingUp, List,
  LogOut, IndianRupee
} from 'lucide-react';
import {
  PieChart, Pie, Cell,
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip
} from 'recharts';
import DownloadCSV from '../components/DownloadCSV';

const CATEGORIES = [
  'Food','Transport','Utilities','Entertainment',
  'Shopping','Health','Bills','Rent','Others'
];

const COLORS = [
  '#2F5E41','#D97706','#44f744','#78716C',
  '#0bf5f5','#61c9a6','#3B82F6','#8B5CF6','#EC4899'
];

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

  const fetchData = async () => {
    try {
      const [analyticsRes, expensesRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/expenses')
      ]);
      setAnalytics(analyticsRes.data);
      setRecentExpenses(expensesRes.data.slice(0, 5));
    } catch {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...expenseData,
        amount: parseFloat(expenseData.amount)
      });

      toast.success('Expense added!');
      setDialogOpen(false);

      setExpenseData({
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });

      fetchData();
    } catch {
      toast.error('Failed to add expense');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  const pieData = analytics?.categories.map((cat, idx) => ({
    name: cat.category,
    value: cat.total,
    color: COLORS[idx % COLORS.length]
  })) || [];

  return (
    <div className="min-h-screen bg-background">

     
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg sm:text-2xl font-bold">ExpenseZen</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm">Hi, {user?.name}</span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

  
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Your expense overview
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => navigate('/expenses')}
              className="w-full sm:w-auto"
            >
              <List className="mr-2 h-4 w-4" />
              View Expenses
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                  <DialogDescription>Enter details</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddExpense}>
                  <div className="space-y-3 py-2">

                    <Input
                      placeholder="Amount"
                      type="number"
                      value={expenseData.amount}
                      onChange={(e) =>
                        setExpenseData({ ...expenseData, amount: e.target.value })
                      }
                      required
                    />

                    <Select
                      value={expenseData.category}
                      onValueChange={(value) =>
                        setExpenseData({ ...expenseData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Description"
                      value={expenseData.description}
                      onChange={(e) =>
                        setExpenseData({ ...expenseData, description: e.target.value })
                      }
                      required
                    />

                    <Input
                      type="date"
                      value={expenseData.date}
                      onChange={(e) =>
                        setExpenseData({ ...expenseData, date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <DialogFooter>
                    <Button type="submit">Add Expense</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">

          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle>Total</CardTitle>
              <IndianRupee />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-3xl font-bold">
                ₹{analytics?.total_expenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-3xl">
                {analytics?.expense_count}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-3xl">
                {analytics?.categories.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Export</CardTitle>
          </CardHeader>
          <CardContent>
            <DownloadCSV />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monthly</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics?.monthly_trend}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#2F5E41" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent</CardTitle>
          </CardHeader>
          <CardContent>
            {recentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex flex-col sm:flex-row justify-between p-3 border rounded-lg mb-2"
              >
                <div>
                  <p>{exp.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {exp.category}
                  </p>
                </div>
                <div className="font-semibold">
                  ₹{exp.amount}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}

*/}

