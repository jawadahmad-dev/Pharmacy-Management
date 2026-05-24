import { Component, OnInit } from '@angular/core';

import { ref, getDatabase, get } from 'firebase/database';
import { Medicine } from '../../Interfaces/medicine';
import { HighchartsChartDirective } from 'highcharts-angular';
import Highcharts from 'highcharts';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Transaction } from '../../Interfaces/transaction';

@Component({
  selector: 'app-dash-board',
  imports: [HighchartsChartDirective, DatePipe, RouterLink],
  standalone: true,
  templateUrl: './dash-board.html',
  styleUrl: './dash-board.scss',
})
export class DashBoard implements OnInit {
  protected dataArr: Medicine[] = [];
  protected transactionsArr: any[] = [];
  private db = getDatabase();
  private medEndPoint = ref(this.db, 'medicines');
  private tranEndPoint = ref(this.db, 'transactions');
  protected lowStock: number = 0;
  protected expired: number = 0;
  protected revenue: number = 0;
  protected overallTran: number = 0;
  protected todayrevenue: number = 0;
  protected todayTran: number = 0;
  protected sales: number = 0;
  protected avgSales: number = 0;
  protected updateFlag = false;

  chartOptions: Highcharts.Options = {
    title: { text: 'Daily Revenue (last 30 days)' },
    xAxis: { categories: [], title: { text: 'Date' } },
    yAxis: { title: { text: 'Revenue' } },
    series: [{ type: 'bar', name: 'Revenue', data: [] }],
    tooltip: {
      pointFormat: '<b>{point.y:.2f}</b>',
    },
    credits: { enabled: false },
  };

  ngOnInit(): void {
    this.getData();
    this.getTransactions();
    this.calculateRevenue();
  }

  snapshot() {
    this.dataArr.forEach((item) => {
      if (item.qty <= 20) {
        this.lowStock += 1;
      }
      const currentDate = new Date().getTime();
      const expiry = new Date(item.expiry).getTime();
      const check = Math.ceil((expiry - currentDate) / (1000 * 60 * 60 * 24));
      if (check <= 0) {
        this.expired += 1;
      }
    });
  }

  getData() {
    const tempArr: Medicine[] = [];
    get(this.medEndPoint).then((getData) => {
      getData.forEach((check) => {
        const dataValue = check.val();
        tempArr.push({ id: dataValue.key, ...dataValue });
      });

      this.dataArr = tempArr;
      this.snapshot();
    });
  }

  getTransactions() {
    const tempArr: Transaction[] = [];

    get(this.tranEndPoint).then((trans) => {
      trans.forEach((item) => {
        const itemVal = item.val();
        tempArr.push({ ...itemVal });
      });

      const size = tempArr.length;
      this.transactionsArr = tempArr.slice(size - 10, size);
    });
  }

  calculateRevenue() {
    get(this.tranEndPoint)
      .then((transactions) => {
        let counter = 0;
        transactions.forEach((item) => {
          const itemVal = item.val();
          const current = new Date().getTime();
          const sellDate = new Date(itemVal.date).getTime();
          const daysDiff = Math.ceil((current - sellDate) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 1) {
            this.todayrevenue += itemVal.total;
            this.todayrevenue = Math.round(this.todayrevenue);
            this.todayTran += 1;
          }
          if (daysDiff <= 30) {
            this.sales += itemVal.total;
            this.sales = Math.round(this.sales);
          }

          this.revenue += itemVal.total;

          this.revenue = Math.round(this.revenue);
          this.overallTran += 1;
          counter += 1;
        });
        this.avgSales = counter > 0 ? this.revenue / counter : 0;
        this.avgSales = Math.round(this.avgSales);

        this.chartOptions = {
          chart: { type: 'bar' },
          title: { text: 'Revenue Overview' },
          xAxis: {
            categories: ['Today', 'Last 30 Days', 'Average / Day', 'Total Revenue'],
          },
          yAxis: { title: { text: 'Amount' } },
          tooltip: { pointFormat: '<b>{point.y:.2f}</b>' },
          series: [
            {
              name: 'Revenue',
              type: 'bar',
              data: [this.todayrevenue, this.sales, this.avgSales, this.revenue],
            },
          ],
          credits: { enabled: false },
        };
        this.updateFlag = true;
      })
      .catch((error) => {
        console.error('Error fetching transactions:', error);
      });
  }
}
