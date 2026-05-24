import { Component, inject, OnInit } from '@angular/core';
import { get, ref, getDatabase, set, update, push } from 'firebase/database';
import { Medicine } from '../../Interfaces/medicine';
import { NgClass } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-sales',
  imports: [NgClass, FormsModule, ReactiveFormsModule],
  templateUrl: './sales.html',
  styleUrl: './sales.scss',
})
export class Sales implements OnInit {
  private db = getDatabase();
  private fb = inject(FormBuilder);
  protected customerForm!: FormGroup;
  private medEndpoint = ref(this.db, 'medicines');
  private tranEndpoint = ref(this.db, 'transactions');
  protected medicinesArr: Medicine[] = [];
  protected filterMedicinesArr: Medicine[] = [];
  protected deleted: boolean = false;
  protected searchVal: string = '';
  protected categoryVal: string = 'All';
  protected cartArr: Medicine[] = [];
  protected subtotal: number = 0;
  protected tax: number = 0;
  protected gtotal: number = 0;
  protected invalidQ: boolean = false;
  protected custName: string = '';
  protected custNum: Number = 0;

  ngOnInit(): void {
    this.getMedicnes();
    this.formInit();
  }

  formInit() {
    this.customerForm = this.fb.group({
      customerName: ['', Validators.required],
      customerNumber: [''],
    });
  }

  getMedicnes() {
    get(this.medEndpoint).then((getAll) => {
      const tempArr: Medicine[] = [];
      getAll.forEach((childs) => {
        const value = childs.val();
        tempArr.push({ id: childs.key, ...value, cartqty: 1, total: 0, subtota: 0 });
      });
      this.medicinesArr = [...tempArr];
      this.filterMedicinesArr = [...tempArr];
    });
  }
  search() {
    this.invalidQ = true;
    const searchQuery = this.searchVal.toLowerCase();
    document.querySelectorAll('.all').forEach((item) => {
      const name = item.querySelector('.name')?.textContent.toLowerCase();
      const manufacturer = item.querySelector('.manufacturer')?.textContent.toLowerCase();

      if (name?.includes(searchQuery) || manufacturer?.includes(searchQuery)) {
        (item as HTMLElement).style.display = '';
        this.invalidQ = false;
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    });
  }
  searchByCatlog() {
    const query = this.categoryVal.toLowerCase();
    if (this.categoryVal === 'All') {
      this.medicinesArr = [...this.filterMedicinesArr];
      return;
    }
    this.medicinesArr = this.filterMedicinesArr.filter((find) => {
      return find.category.toLowerCase() === query;
    });
  }
  resetQty(toZero: number) {
    toZero = 0;
  }

  toCart(item: Medicine, qty: number) {
    const existing = this.cartArr.find((check) => {
      return check.id === item.id;
    });
    if (existing) {
      existing.cartqty += qty;
      existing.total = item.sellprice * existing.cartqty;

      this.totalCalculate();
      this.getMedicnes();
      return;
    } else {
      this.cartArr.push({
        ...item,
        cartqty: qty,
        total: item.sellprice * qty,
      });
    }

    this.cartArr = [...this.cartArr];
    this.totalCalculate();
    this.getMedicnes();
  }

  totalCalculate() {
    this.subtotal = 0;
    this.tax = 0;
    this.gtotal = 0;
    this.cartArr.forEach((meds) => {
      meds.total = meds.sellprice * meds.cartqty;
      this.subtotal += meds.total;
      this.tax = (this.subtotal * 8) / 100;
      this.gtotal = this.subtotal + this.tax;
    });
  }
  removeMedFromCart(index: number) {
    this.cartArr.splice(index, 1);
    this.totalCalculate();
  }
  onFinalize() {
    const formVal = this.customerForm.value;
    const transaction = {
      name: formVal.customerName,
      number: formVal.customerNumber,
      date: Date.now(),
      boughtItems: this.cartArr,
      total: this.gtotal,
    };
    this.printReceipt();

    push(this.tranEndpoint, transaction);
    this.cartArr.forEach((cartMed) => {
      const medRef = ref(this.db, `medicines/${cartMed.id}`);
      get(medRef).then((snap) => {
        if (!snap.exists()) return;

        const currentQty = snap.val().qty;
        update(medRef, {
          qty: currentQty - cartMed.cartqty,
        });
      });
    });

    this.cartArr = [];
    this.customerForm.reset();
    this.subtotal = 0;
    this.tax = 0;
    this.gtotal = 0;
    setTimeout(() => {
      this.getMedicnes();
    }, 1000);
  }

  printReceipt() {
    const source = document.getElementById('printData');
    if (!source) return;

    // Clone node (keeps content, removes layout side-effects)
    const clone = source.cloneNode(true) as HTMLElement;

    // Remove Tailwind classes that use oklch
    clone.querySelectorAll('*').forEach((el: any) => {
      el.style.background = '#ffffff';
      el.style.color = '#000000';
      el.style.borderColor = '#e5e7eb';
      el.style.boxShadow = 'none';
    });

    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = '600px';
    document.body.appendChild(clone);

    html2canvas(clone, {
      backgroundColor: '#ffffff',
      scale: 2,
    }).then((canvas) => {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, imgHeight);
      pdf.save('sale-receipt.pdf');

      document.body.removeChild(clone);
    });
  }
}
