import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ClientBasicInfoComponent } from './client-basic-info.component';

describe('ClientBasicInfoComponent', () => {
  let component: ClientBasicInfoComponent;
  let fixture: ComponentFixture<ClientBasicInfoComponent>;
  CommonTestingModule.setUpTestBed(ClientBasicInfoComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        FormsModule
      ],
      declarations: [ClientBasicInfoComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClientBasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
