import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NewFlowComponent } from './new-flow.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('NewFlowComponent', () => {
  let component: NewFlowComponent;
  let fixture: ComponentFixture<NewFlowComponent>;
  CommonTestingModule.setUpTestBed(NewFlowComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NewFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
