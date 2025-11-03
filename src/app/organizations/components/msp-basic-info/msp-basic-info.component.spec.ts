import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MspBasicInfoComponent } from './msp-basic-info.component';

describe('MspBasicInfoComponent', () => {
  let component: MspBasicInfoComponent;
  let fixture: ComponentFixture<MspBasicInfoComponent>;
  CommonTestingModule.setUpTestBed(MspBasicInfoComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        FormsModule
      ],
      declarations: [MspBasicInfoComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MspBasicInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
