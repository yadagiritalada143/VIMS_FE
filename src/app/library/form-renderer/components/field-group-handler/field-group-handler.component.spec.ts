import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FieldGroupHandlerComponent } from './field-group-handler.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FieldGroupHandlerComponent', () => {
  let component: FieldGroupHandlerComponent;
  let fixture: ComponentFixture<FieldGroupHandlerComponent>;
  CommonTestingModule.setUpTestBed(FieldGroupHandlerComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldGroupHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
