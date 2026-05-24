import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  equalTo,
  get,
  getDatabase,
  orderByChild,
  query,
  ref,
  set,
  update,
} from 'firebase/database';

@Component({
  selector: 'app-signin',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private db = getDatabase();
  private userRef = ref(this.db, 'register');
  private auth = ref(this.db, 'auth');
  signInForm!: FormGroup;
  ngOnInit(): void {
    this.formInit();
  }
  formInit() {
    this.signInForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    const userData = {
      email: this.signInForm.value.email,
      password: this.signInForm.value.password,
    };
    const checkEmail = query(this.userRef, orderByChild('email'), equalTo(userData.email));
    get(checkEmail).then((find) => {
      if (!find.exists()) {
        alert('Please Register');
        this.router.navigateByUrl('/signup');
        return;
      } else {
        find.forEach((check) => {
          const user = check.val();
          if (userData.password !== user.password || userData.email !== user.email) {
            alert('please enter valid credentials');
            return;
          }
          if (userData.password === user.password && userData.email === user.email) {
            if (!user.role) {
              alert('Worker not approved by Admin');
              return;
            } else {
              update(this.auth, { loggedIn: true, role: user.role, id: user.id })
                .then(() => {
                  if (user.role === 'admin') {
                    this.router.navigateByUrl('/admin');
                  } else {
                    this.router.navigateByUrl('/worker');
                  }
                })
                .catch(() => {
                  alert('error');
                });
            }
          }
        });
      }
    });
  }
}
