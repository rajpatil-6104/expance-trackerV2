import { useState, useEffect } from 'react';
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
    if (selectedCategory === 'All') {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(expenses.filter(exp => exp.category === selectedCategory));
    }
  }, [selectedCategory, expenses]);

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
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h2 className="text-4xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>All Expenses</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]" data-testid="category-filter-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CSV Download Section */}
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
                        ${expense.amount.toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(expense)}
                          data-testid={`edit-expense-${expense.id}`}
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
                          data-testid={`delete-expense-${expense.id}`}
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
