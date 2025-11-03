import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { TreeHeaderComponent } from './tree-header.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('TreeHeaderComponent', () => {
  let component: TreeHeaderComponent;
  let fixture: ComponentFixture<TreeHeaderComponent>;
  CommonTestingModule.setUpTestBed(TreeHeaderComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
