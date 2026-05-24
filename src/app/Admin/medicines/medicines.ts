import { Component, inject, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { get, getDatabase, push, ref, remove, set, update } from 'firebase/database';
import { Medicine } from '../../Interfaces/medicine';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-medicines',
  imports: [ReactiveFormsModule, DatePipe, NgClass, FormsModule],
  templateUrl: './medicines.html',
  styleUrl: './medicines.scss',
})
export class Medicines implements OnInit {
  private fb = inject(FormBuilder);
  protected newMedForm!: FormGroup;
  protected medicinesArr: Medicine[] = [];
  protected filterMedicinesArr: Medicine[] = [];
  private db = getDatabase();
  protected showForm: boolean = false;
  private medEndpoint = ref(this.db, 'medicines');
  private editId: string = '';
  protected lowStock: number = 0;
  protected stockOut: number = 0;
  protected expireSoon: number = 0;
  protected searchVal: string = '';
  protected invalidQ: boolean = false;
  protected filterVal: string = 'All';
  protected totalMeds: number = 0;

  ngOnInit(): void {
    this.formInit();
    this.getMedicnes();
  }

  toggleForm() {
    this.showForm = !this.showForm;
  }

  snapshot() {
    this.lowStock = 0;
    this.expireSoon = 0;
    this.stockOut = 0;
    this.totalMeds = 0;
    this.medicinesArr.forEach((item) => {
      if (item.qty <= 20) {
        this.lowStock += 1;
      }
      if (item.qty <= 0) {
        this.stockOut += 1;
      }
      const currentDate = new Date().getTime();
      const expiry = new Date(item.expiry).getTime();
      const daysLeft = Math.ceil((expiry - currentDate) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 10) {
        this.expireSoon += 1;
      }
    });
    this.totalMeds = this.medicinesArr.length;
  }

  formInit() {
    this.newMedForm = this.fb.group({
      medname: ['', Validators.required],
      category: ['', Validators.required],
      manufacturer: ['', Validators.required],
      expiry: ['', Validators.required],
      purchaseprice: ['', Validators.required],
      sellprice: ['', Validators.required],
      qty: ['', Validators.required],
      desc: [''],
    });
  }

  onSubmit() {
    const formData = this.newMedForm.value;
    const expiry = new Date(this.newMedForm.value.expiry).getTime();
    const currentDate = new Date().getTime();
    const daysLeft = Math.ceil((expiry - currentDate) / (1000 * 60 * 60 * 24));

    if (this.editId) {
      update(ref(this.db, `medicines/${this.editId}`), {
        daysLeft: daysLeft,
        id: this.editId,
        ...formData,
      }).then(() => {
        this.newMedForm.reset();
      });
    } else {
      const setMed = push(this.medEndpoint);
      set(setMed, {
        daysLeft: daysLeft,
        id: setMed.key,
        ...this.newMedForm.value,
      }).then(() => {
        this.newMedForm.reset();
      });
    }
    this.editId = '';
  }

  forEdit(med: Medicine) {
    this.editId = med.id;
    this.newMedForm.patchValue({
      medname: med.medname,
      category: med.category,
      manufacturer: med.manufacturer,
      expiry: med.expiry,
      purchaseprice: med.purchaseprice,
      sellprice: med.sellprice,
      qty: med.qty,
      desc: med.desc,
    });
  }

  getMedicnes() {
    get(this.medEndpoint).then((getAll) => {
      const tempArr: Medicine[] = [];
      getAll.forEach((childs) => {
        const value = childs.val();
        const expiry = new Date(value.expiry).getTime();
        const currentDate = Date.now();
        const daysLeft = Math.ceil((expiry - currentDate) / (1000 * 60 * 60 * 24));
        tempArr.push({ id: childs.key, ...value, daysLeft });
      });
      this.medicinesArr = tempArr;
      this.filterMedicinesArr = tempArr;
      this.snapshot();
    });
  }

  search() {
    this.invalidQ = true;
    const queryVal = this.searchVal.toLowerCase();
    document.querySelectorAll('.all').forEach((item) => {
      const name = item.querySelector('.name')?.textContent.toLowerCase() || '';
      const manufacturer = item.querySelector('.manufacturer')?.textContent.toLowerCase() || '';
      if (name?.includes(queryVal) || manufacturer?.includes(queryVal)) {
        (item as HTMLElement).style.display = '';
        this.invalidQ = false;
      } else {
        (item as HTMLElement).style.display = 'none';
      }
    });
  }

  deleteMed(id: string) {
    remove(ref(this.db, `medicines/${id}`));
    this.getMedicnes();
  }

  searchByCatlog() {
    const queryvalue = this.filterVal.toLowerCase();
    if (this.filterVal === 'All') {
      this.medicinesArr = [...this.filterMedicinesArr];
      return;
    }
    this.medicinesArr = this.filterMedicinesArr.filter((find) => {
      return find.category.toLowerCase() === queryvalue;
    });
  }
}
