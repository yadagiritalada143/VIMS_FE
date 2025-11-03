import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PicklistComponent } from './picklist.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PicklistComponent', () => {
  let component: PicklistComponent;
  let fixture: ComponentFixture<PicklistComponent>;
  CommonTestingModule.setUpTestBed(PicklistComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PicklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
