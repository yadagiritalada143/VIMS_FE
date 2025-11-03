import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DelegatesComponent } from './delegates.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('DelegatesComponent', () => {
  let component: DelegatesComponent;
  let fixture: ComponentFixture<DelegatesComponent>;
  CommonTestingModule.setUpTestBed(DelegatesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(DelegatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
