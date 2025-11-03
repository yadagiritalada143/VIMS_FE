import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SecurityComponent } from './security.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SecurityComponent', () => {
  let component: SecurityComponent;
  let fixture: ComponentFixture<SecurityComponent>;
  CommonTestingModule.setUpTestBed(SecurityComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
