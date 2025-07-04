import { AddTransactionForm } from "@/types";

export function validateTransactionForm(form: AddTransactionForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.coin_id) {
    errors.coin = "Please select a cryptocurrency";
  }

  if (!form.amount || parseFloat(form.amount) <= 0) {
    errors.amount = "Amount must be greater than 0";
  }

  if (!form.price_usd || parseFloat(form.price_usd) <= 0) {
    errors.price_usd = "Price must be greater than 0";
  }

  return errors;
}