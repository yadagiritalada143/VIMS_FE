import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { TenureLimitCreateComponent } from './tenure-limit-create.component';

describe('TenureLimitCreateComponent', () => {
  let component: TenureLimitCreateComponent;
  let fixture: ComponentFixture<TenureLimitCreateComponent>;
  CommonTestingModule.setUpTestBed(TenureLimitCreateComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TenureLimitCreateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TenureLimitCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
