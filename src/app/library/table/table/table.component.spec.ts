import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VMSTableComponent } from './table.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VMSTableComponent', () => {
  let component: VMSTableComponent;
  let fixture: ComponentFixture<VMSTableComponent>;
  CommonTestingModule.setUpTestBed(VMSTableComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VMSTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
