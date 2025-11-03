import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FlowsListComponent } from './flows-list.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('FlowsListComponent', () => {
  let component: FlowsListComponent;
  let fixture: ComponentFixture<FlowsListComponent>;
  CommonTestingModule.setUpTestBed(FlowsListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FlowsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
