import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoFieldsComponent } from './no-fields.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NoFieldsComponent', () => {
  let component: NoFieldsComponent;
  let fixture: ComponentFixture<NoFieldsComponent>;
  CommonTestingModule.setUpTestBed(NoFieldsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NoFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
