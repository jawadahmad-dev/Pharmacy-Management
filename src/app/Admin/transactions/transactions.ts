import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../Interfaces/transaction';
import { getDatabase, ref, get } from 'firebase/database';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-transactions',
  imports: [FormsModule, DatePipe],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class Transactions implements OnInit {
  private db = getDatabase();
  private tranEndpoint = ref(this.db, 'transactions');
  protected invalidQ: boolean = false;
  protected transactionsArr: Transaction[] = [];
  protected searchVal: string = '';
  protected filterVal: string = 'All';

  ngOnInit(): void {
    this.getTransactions();
  }
  search() {
    this.invalidQ = true;
    const query = this.searchVal.toLowerCase();
    document.querySelectorAll('.all').forEach((item) => {
      const name = item.querySelector('.name')?.textContent.toLowerCase() || '';
      if (name?.includes(query)) {
        (item as HTMLElement).style.display = '';
        this.invalidQ = false;
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    });
  }

  searchByCatlog() {
    if (this.filterVal === 'All') {
      this.getTransactions();
      return;
    }
    const tempArr: Transaction[] = [];
    this.transactionsArr.filter((check) => {
      const current = new Date().getTime();
      const sellDate = new Date(check.date).getTime();
      const days = Math.ceil((current - sellDate) / (1000 * 60 * 60 * 24));
      if (days <= Number(this.filterVal)) {
        tempArr.push({ ...check });
      }
    });
    this.transactionsArr = tempArr;
  }

  getTransactions() {
    const tempArr: Transaction[] = [];
    get(this.tranEndpoint).then((tran) => {
      tran.forEach((item) => {
        const itemVal = item.val();
        tempArr.push({ ...itemVal });
      });
    });
    this.transactionsArr = tempArr;
  }
}
