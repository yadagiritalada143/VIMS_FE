import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FlowsViewComponent } from './flows-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FlowsViewComponent', () => {
  let component: FlowsViewComponent;
  let fixture: ComponentFixture<FlowsViewComponent>;
  CommonTestingModule.setUpTestBed(FlowsViewComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
