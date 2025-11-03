import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { VMSRowComponent } from './row.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('VMSRowComponent', () => {
  let component: VMSRowComponent;
  let fixture: ComponentFixture<VMSRowComponent>;
  CommonTestingModule.setUpTestBed(VMSRowComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(VMSRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
